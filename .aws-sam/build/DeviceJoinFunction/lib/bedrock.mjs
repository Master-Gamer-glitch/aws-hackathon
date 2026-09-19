import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({});
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

export async function invokeModel(prompt, maxTokens = 2048) {
  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  try {
    const response = await bedrock.send(command);
    const text = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(text);
    return parsed.content[0].text;
  } catch (err) {
    console.error('Bedrock API error:', err);
    throw err;
  }
}

export async function invokeBedrockAgent(agent, task) {
  try {
    switch (agent) {
      case 'lead':
        return await leadAgent(task);
      case 'coder':
        return await coderAgent(task);
      case 'tester':
        return await testerAgent(task);
      case 'reviewer':
        return await reviewerAgent(task);
      default:
        throw new Error(`Unknown agent: ${agent}`);
    }
  } catch (err) {
    console.error(`Agent ${agent} error:`, err);
    throw err;
  }
}

async function leadAgent(task) {
  const { outcome, deadline } = task;

  const prompt = `You are the lead AI for a software project. Split a project outcome into 4-8 bounded task contracts.

PROJECT OUTCOME:
${outcome}

DEADLINE: ${deadline}

For each task, create a contract with:
- objective: what needs to be done (specific, 1 sentence)
- expectedOutput: what the result looks like (specific, testable)
- successCriteria: array of 3-5 measurable criteria
- allowedActions: array of allowed operations (read_repo, write_code, test, commit, publish, deploy)
- budget: { usd: X } where total ≤ 5.0
- ownerAgent: one of 'lead', 'coder', 'design', 'tester', 'reviewer'
- dependsOn: array of task indices this depends on (empty if none)

Output ONLY valid JSON, no other text:
{
  "tasks": [
    { objective, expectedOutput, successCriteria, allowedActions, budget, ownerAgent, dependsOn },
    ...
  ]
}`;

  const response = await invokeModel(prompt, 3000);

  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in lead agent response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
}

async function coderAgent(task) {
  const { objective, allowedActions, contract } = task;

  const prompt = `You are a senior software engineer. Implement the following task:

OBJECTIVE: ${objective}

ALLOWED ACTIONS: ${allowedActions.join(', ')}

Requirements from contract:
- Expected output: ${contract?.expectedOutput}
- Success criteria: ${contract?.successCriteria?.join(', ')}

Write production-quality code that:
1. Passes all success criteria
2. Only uses allowed actions
3. Is well-tested and documented
4. Handles edge cases

Respond with JSON:
{
  "code": "the implementation",
  "explanation": "why this approach",
  "tested": true/false
}`;

  const response = await invokeModel(prompt, 4000);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in coder response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function testerAgent(task) {
  const { objective, successCriteria, manifest } = task;

  const prompt = `You are a QA engineer. Score the implementation against success criteria.

OBJECTIVE: ${objective}

SUCCESS CRITERIA:
${successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPLEMENTATION MANIFEST:
${JSON.stringify(manifest, null, 2)}

For each criterion, evaluate:
- Does it pass? (yes/no)
- Evidence (what shows it works)
- Feedback (what's missing if failed)

Respond with JSON:
{
  "passed": true/false,
  "criteria": [
    { name: "criterion 1", passed: true/false, evidence: "...", feedback: "..." },
    ...
  ],
  "summary": "overall assessment"
}`;

  const response = await invokeModel(prompt, 2000);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in tester response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function reviewerAgent(task) {
  const { objective, expectedOutput, manifest, criteria } = task;

  const prompt = `You are a code reviewer. Judge the output quality and completeness.

OBJECTIVE: ${objective}

EXPECTED OUTPUT: ${expectedOutput}

WHAT WAS DELIVERED:
${JSON.stringify(manifest, null, 2)}

VERIFICATION RESULTS:
${criteria.map(c => `${c.passed ? '✅' : '❌'} ${c.name}`).join('\n')}

Evaluate:
- Does it match the expected output?
- Is it production-ready?
- What could be better?
- Is it complete?

Respond with JSON:
{
  "approved": true/false,
  "quality": "excellent/good/fair/poor",
  "feedback": "detailed review",
  "blockers": ["list", "of", "issues"] or [],
  "recommendations": ["list", "of", "improvements"] or []
}`;

  const response = await invokeModel(prompt, 2000);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in reviewer response');
  }

  return JSON.parse(jsonMatch[0]);
}

export default {
  invokeModel,
  invokeBedrockAgent,
  leadAgent,
  coderAgent,
  testerAgent,
  reviewerAgent
};
