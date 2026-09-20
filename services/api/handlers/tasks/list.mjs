/**
 * GET /projects/{projectId}/tasks
 * List all tasks for a project (for demo UI / debugging)
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

export async function listTasksHandler(event) {
  const { projectId } = event.pathParameters || {};

  if (!projectId) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'projectId required' }) };
  }

  try {
    const tasks = await db.queryTable(
      TABLES.TASKS,
      'projectId = :pid',
      { ':pid': projectId }
    );

    const summary = (tasks || []).map((t) => ({
      taskId: t.taskId,
      state: t.state,
      leaseOwner: t.leaseOwner || null,
      leaseEpoch: t.leaseEpoch ?? 0,
      leaseExpiry: t.leaseExpiry || null,
      attempts: t.attempts || 0,
      objective: t.contract?.objective || null,
      ownerAgent: t.contract?.ownerAgent || null,
      budget: t.contract?.budget || null,
      resultDeviceId: t.resultDeviceId || null,
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ projectId, count: summary.length, tasks: summary }),
    };
  } catch (err) {
    console.error('List error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
}

export default listTasksHandler;
