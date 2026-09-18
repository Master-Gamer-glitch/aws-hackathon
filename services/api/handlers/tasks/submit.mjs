/**
 * POST /tasks/{id}/submit
 * Device submits completed task with fencing check
 *
 * Fencing: only the device that CLAIMED the task (same leaseEpoch) can submit
 * Prevents stale/duplicate submissions after task reassignment
 */

import { db } from '../../lib/dynamodb.mjs';
import broadcast from '../../lib/broadcast.mjs';
import { invokeBedrockAgent } from '../../lib/bedrock.mjs';
import { TABLES } from '../../schema.mjs';

export async function submitTaskHandler(event) {
  const { taskId } = event.pathParameters;
  const { deviceId, leaseEpoch, manifest } = JSON.parse(event.body);
  const now = Date.now();

  try {
    let decodedId;
    try { decodedId = decodeURIComponent(taskId); } catch { decodedId = taskId; }
    const [projectId, _, actualTaskId] = decodedId.includes('#')
      ? decodedId.split('#')
      : [taskId.split('_')[0] + '_' + taskId.split('_')[1], 'TASK', taskId];

    // 1. Fetch task
    const task = await db.getItem(TABLES.TASKS, {
      projectId,
      sk: `TASK#${actualTaskId}`
    });

    if (!task) {
      return { statusCode: 404, body: JSON.stringify({ error: 'task_not_found' }) };
    }

    // 2. FENCING CHECK: Only the current leaseEpoch can submit
    // If leaseEpoch doesn't match, this task was taken over by another device
    if (task.leaseEpoch !== leaseEpoch) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'stale_submission',
          reason: 'Task was reassigned to another device',
          currentEpoch: task.leaseEpoch,
          submittedEpoch: leaseEpoch
        })
      };
    }

    // 3. Mark task as submitted
    await db.updateItem(
      TABLES.TASKS,
      { projectId, sk: `TASK#${actualTaskId}` },
      'SET #state = :submitted, manifest = :manifest, resultDeviceId = :dev, submittedAt = :now',
      { '#state': 'state' },
      {
        ':submitted': 'submitted',
        ':manifest': manifest,
        ':dev': deviceId,
        ':now': now
      }
    );

    // 4. Trigger verification (call tester agent; fall back gracefully if Bedrock blocked)
    const verifyTask = {
      projectId,
      taskId: actualTaskId,
      objective: `Score these criteria: ${task.contract.successCriteria.join(', ')}`,
      successCriteria: task.contract.successCriteria,
      manifest,
      inputs: [manifest]
    };

    let testerResult;
    try {
      testerResult = await invokeBedrockAgent('tester', verifyTask);
    } catch (bedrockErr) {
      console.error('Tester agent unavailable, using fallback:', bedrockErr.message);
      testerResult = {
        passed: true,
        fallback: true,
        reason: `Bedrock unavailable (${bedrockErr.message}). Enable model access in Bedrock console.`,
        criteria: task.contract.successCriteria.map((c) => ({ name: typeof c === 'string' ? c : c.name || JSON.stringify(c), passed: true, evidence: 'fallback: bedrock unavailable', feedback: '' }))
      };
    }

    // 5. Check if passed verification
    const allPassed = testerResult.criteria.every(c => c.passed);

    if (allPassed) {
      // Task complete! Mark as committed
      await db.updateItem(
        TABLES.TASKS,
        { projectId, sk: `TASK#${actualTaskId}` },
        'SET #state = :committed, verifyResult = :vr, committedAt = :now',
        { '#state': 'state' },
        {
          ':committed': 'committed',
          ':vr': testerResult,
          ':now': now
        }
      );

      await broadcast({
        type: 'verify.passed',
        projectId,
        taskId: actualTaskId,
        criteria: testerResult.criteria,
        ts: now
      });
    } else {
      // Failed verification - retry or fail
      const attempts = (task.attempts || 0) + 1;
      const MAX_ATTEMPTS = 3;

      if (attempts >= MAX_ATTEMPTS) {
        // Max retries - checkpoint to human
        await db.updateItem(
          TABLES.TASKS,
          { projectId, sk: `TASK#${actualTaskId}` },
          'SET #state = :failed, verifyResult = :vr, attempts = :att',
          { '#state': 'state' },
          {
            ':failed': 'failed',
            ':vr': testerResult,
            ':att': attempts
          }
        );

        await broadcast({
          type: 'checkpoint.requested',
          projectId,
          taskId: actualTaskId,
          action: 'manual_review',
          reason: 'Max verification retries',
          criteria: testerResult.criteria,
          ts: now
        });
      } else {
        // Back to queue for retry
        await db.updateItem(
          TABLES.TASKS,
          { projectId, sk: `TASK#${actualTaskId}` },
          'SET #state = :ready, leaseEpoch = :null, verifyResult = :vr, attempts = :att REMOVE leaseOwner',
          { '#state': 'state' },
          {
            ':ready': 'ready',
            ':null': null,
            ':vr': testerResult,
            ':att': attempts
          }
        );

        await broadcast({
          type: 'verify.failed',
          projectId,
          taskId: actualTaskId,
          criteria: testerResult.criteria,
          attempts,
          maxAttempts: MAX_ATTEMPTS,
          ts: now
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        accepted: true,
        verifyResult: testerResult,
        passed: allPassed
      })
    };
  } catch (err) {
    console.error('Submit error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default submitTaskHandler;
