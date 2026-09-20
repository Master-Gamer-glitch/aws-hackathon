/**
 * POST /projects/{projectId}/rooms/{roomId}/plan
 *
 * Create the tasks for a room from contracts the caller supplies. This is the LLM-free way
 * to plan: whoever has a model (the master's device, a script, a person) writes the
 * contracts and posts them here. The lead-agent endpoint (/outcomes) does the same with
 * Bedrock and needs model access on the AWS account.
 *
 * Body: { outcome, tasks: [{ objective, expectedOutput, successCriteria[], files?[], notes?,
 *                             allowedActions?[], budget?, ownerAgent?, requiredTools?[] }] }
 *
 * Tasks are tagged with the room and a fresh planId. Planning again supersedes the previous
 * plan for that room (its tasks are ignored, not deleted).
 */

import crypto from 'node:crypto';
import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';
import { withCors } from '../../lib/cors.mjs';
import { normalizePlan } from '../../lib/contracts.mjs';

async function planHandlerImpl(event) {
  const { projectId, roomId } = event.pathParameters;
  const { outcome, contracts } = normalizePlan(JSON.parse(event.body || '{}')); // 400 on bad input

  const room = await db.getItem(TABLES.ROOMS, { roomId });
  if (!room) return { statusCode: 404, body: JSON.stringify({ error: 'Room not found' }) };

  const now = Date.now();
  const planId = `plan_${crypto.randomBytes(4).toString('hex')}`;

  const items = contracts.map((contract, i) => ({
    projectId,
    sk: `TASK#task_${crypto.randomBytes(4).toString('hex')}`,
    state: 'ready',
    contract,
    outcome,
    roomId,
    planId,
    planIndex: i,
    createdAt: now + i, // keeps plan order stable when listed
    attempts: 0,
    leaseEpoch: 0,
    expiresAt: Math.floor(now / 1000) + 86400, // TTL is epoch seconds
  }));
  for (const item of items) item.taskId = item.sk.slice('TASK#'.length);

  for (const item of items) await db.putItem(TABLES.TASKS, item);

  await db.updateItem(TABLES.ROOMS, { roomId }, {
    planId,
    outcome,
    plannedTaskCount: items.length,
    updatedAt: now,
    expiresAt: now + 86400000,
  });

  console.log(`[PLAN] Room ${roomId}: plan ${planId} with ${items.length} tasks`);
  await broadcast(events.planCreated(projectId, items.length, outcome));

  return {
    statusCode: 200,
    body: JSON.stringify({
      roomId,
      planId,
      tasks: items.map((t) => ({ taskId: t.taskId, objective: t.contract.objective, files: t.contract.files || [] })),
      message: `Planned ${items.length} task(s)`,
    }),
  };
}

export const planHandler = withCors(planHandlerImpl);
export default planHandler;
