/**
 * POST /projects/{id}/outcomes
 * Lead agent splits outcome into task contracts
 *
 * Takes a project outcome (objective, deadline) and returns 4-8 bounded tasks
 */

import { db } from '../../lib/dynamodb.mjs';
import { invokeModel } from '../../lib/bedrock.mjs';
import broadcast from '../../lib/broadcast.mjs';
import { TABLES } from '../../schema.mjs';
import crypto from 'crypto';

// Contract validation schema
const validateContract = (task) => {
  const required = ['objective', 'expectedOutput', 'successCriteria', 'allowedActions', 'budget', 'ownerAgent'];
  for (const field of required) {
    if (!task[field]) throw new Error(`Missing required field: ${field}`);
  }
  if (!Array.isArray(task.successCriteria) || task.successCriteria.length === 0) {
    throw new Error('successCriteria must be non-empty array');
  }
  if (typeof task.budget.usd !== 'number' || task.budget.usd <= 0) {
    throw new Error('budget.usd must be positive number');
  }
  return true;
};

export async function leadAgentHandler(event) {
  const body = JSON.parse(event.body);
  const projectId = event.pathParameters?.projectId || body.projectId;
  const { outcome, deadline, captureId } = body;
  if (!projectId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'projectId required in path or body' }) };
  }
  const now = Date.now();

  try {
    // 1. If captureId provided, fetch the extracted spec from photo
    let outcomeText = outcome;
    if (captureId) {
      // In real implementation, fetch from S3 or capture table
      // For now, just use the provided outcome
    }

    // 2. Call Claude via Bedrock to split outcome into contracts
    const prompt = `You are the lead AI for a software project. Your job is to split a project outcome into 4-8 bounded task contracts.

PROJECT OUTCOME:
${outcomeText}

DEADLINE: ${deadline}

For each task, create a contract with:
- objective: what needs to be done (specific, 1 sentence)
- expectedOutput: what the result looks like (specific, testable)
- successCriteria: array of 3-5 measurable criteria
- allowedActions: array of allowed operations (read_repo, write_code, test, commit, publish, deploy)
- budget: { usd: X } where total ≤ 5.0
- ownerAgent: one of 'lead', 'coder', 'design', 'tester', 'reviewer'
- dependsOn: array of task indices this depends on (empty if none)

Output valid JSON:
{
  "tasks": [
    { objective, expectedOutput, successCriteria, allowedActions, budget, ownerAgent, dependsOn },
    ...
  ],
  "reasoning": "brief explanation of splits"
}`;

    const response = await invokeModel(prompt, 3000);

    // 3. Parse and validate contracts
    let parsed;
    try {
      // Extract JSON from response (Claude might add text before/after)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('Parse error:', err, 'Response:', response);
      throw new Error('Failed to parse lead agent response');
    }

    if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
      throw new Error('Lead agent returned no tasks');
    }

    // Validate each task
    for (const task of parsed.tasks) {
      validateContract(task);
    }

    // 4. Create task records in DynamoDB
    const tasks = [];
    let totalCost = 0;

    for (let i = 0; i < parsed.tasks.length; i++) {
      const contractTemplate = parsed.tasks[i];
      const taskId = `task_${crypto.randomBytes(4).toString('hex')}`;
      totalCost += contractTemplate.budget.usd;

      const task = {
        projectId,
        sk: `TASK#${taskId}`,
        taskId,
        state: 'ready',
        contract: contractTemplate,
        createdAt: now,
        expiresAt: new Date(deadline).getTime() + 86400000, // 24h after deadline
        attempts: 0
      };

      tasks.push(task);
      await db.putItem(TABLES.TASKS, task);
    }

    // 5. Save plan draft
    const planId = `pl_${crypto.randomBytes(4).toString('hex')}`;
    const plan = {
      projectId,
      sk: `PLAN#${planId}`,
      planId,
      outcome,
      deadline,
      tasks: tasks.map(t => ({ taskId: t.taskId, contract: t.contract })),
      totalTasks: tasks.length,
      estCostUsd: totalCost,
      estMinutes: tasks.length * 5,
      createdAt: now
    };

    await db.putItem(TABLES.PROJECTS, plan);

    // 6. Store project record
    const project = {
      projectId,
      sk: 'PROJ',
      outcome,
      deadline,
      planId,
      taskCount: tasks.length,
      createdAt: now
    };

    await db.putItem(TABLES.PROJECTS, project);

    // 7. Broadcast planning complete
    await broadcast({
      type: 'plan.created',
      projectId,
      planId,
      taskCount: tasks.length,
      totalCost: totalCost,
      ts: now
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        planId,
        projectId,
        outcome,
        deadline,
        taskCount: tasks.length,
        totalCostUsd: totalCost,
        estMinutes: plan.estMinutes,
        tasks: tasks.map(t => ({
          taskId: t.taskId,
          objective: t.contract.objective,
          budget: t.contract.budget
        }))
      })
    };
  } catch (err) {
    console.error('Lead agent error:', err);
    const bedrockBlocked = /not allowed|invalid.*model|access|ValidationException/i.test(err.message || '');
    return {
      statusCode: bedrockBlocked ? 502 : 500,
      body: JSON.stringify({
        error: err.message,
        ...(bedrockBlocked ? { hint: 'Bedrock model access not enabled. In AWS console: Bedrock → Model access → enable a Claude/Haiku model, then retry.' } : {})
      })
    };
  }
}

export default leadAgentHandler;
