/**
 * POST /tasks/{id}/claim
 * Device claims a task to work on it
 *
 * Uses lease protocol from @crewdesk/core:
 * 1. Load task from DynamoDB
 * 2. Call lease.claim() to get lease fields
 * 3. Conditional write: state='ready' OR leaseExpiry < now
 * 4. Broadcast event
 */

import { db } from '../../lib/dynamodb.mjs';
import broadcast from '../../lib/broadcast.mjs';
import { TABLES } from '../../schema.mjs';

const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*' };

// Lease config (from @crewdesk/core/lease.mjs)
const LEASE_MS = 30000; // 30 seconds

export async function claimTaskHandler(event) {
  const { taskId } = event.pathParameters;
  const { deviceId } = JSON.parse(event.body);
  const now = Date.now();

  try {
    // 1. Extract projectId from composite key (proj_123#TASK#task_456)
    // API Gateway may pass %23 literally, so decode first
    let decodedId;
    try { decodedId = decodeURIComponent(taskId); } catch { decodedId = taskId; }
    const [projectId, _, actualTaskId] = decodedId.includes('#')
      ? decodedId.split('#')
      : [taskId.split('_')[0] + '_' + taskId.split('_')[1], 'TASK', taskId];

    // 2. Fetch task
    const task = await db.getItem(TABLES.TASKS, {
      projectId,
      sk: `TASK#${actualTaskId}`
    });

    if (!task) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'task_not_found' })
      };
    }

    // 3. Check if task is in a claimable state
    // Can claim if: state='ready' OR leaseExpiry < now (previous lease expired)
    if (task.state !== 'ready' && (task.leaseExpiry || 0) > now) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'lease_held', leaseOwner: task.leaseOwner })
      };
    }

    // 4. Calculate lease fields
    const leaseEpoch = (task.leaseEpoch || 0) + 1;
    const leaseExpiry = now + LEASE_MS;

    // 5. DynamoDB conditional write
    // Only succeeds if state='ready' OR leaseExpiry < now
    // This prevents two devices from both claiming the same task
    try {
      const updated = await db.updateItem(
        TABLES.TASKS,
        { projectId, sk: `TASK#${actualTaskId}` },
        'SET #state = :state, leaseOwner = :dev, leaseEpoch = :epoch, leaseExpiry = :exp, attempts = :att',
        { '#state': 'state' },
        {
          ':state': 'leased',
          ':dev': deviceId,
          ':epoch': leaseEpoch,
          ':exp': leaseExpiry,
          ':att': (task.attempts || 0),
          ':ready': 'ready',
          ':now': now
        },
        '(#state = :ready OR leaseExpiry < :now)'
      );

      // 6. Broadcast event
      await broadcast({
        type: 'task.claimed',
        projectId,
        taskId: actualTaskId,
        deviceId,
        leaseEpoch,
        leaseExpiry,
        ts: now
      });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          leaseEpoch,
          leaseExpiry,
          message: 'Task claimed successfully'
        })
      };
    } catch (err) {
      if (err.message === 'CONDITION_FAILED') {
        return {
          statusCode: 409,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'lease_held', leaseOwner: task.leaseOwner })
        };
      }
      throw err;
    }
  } catch (err) {
    console.error('Claim error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default claimTaskHandler;
