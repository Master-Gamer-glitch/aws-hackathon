/**
 * EventBridge triggered every 15 seconds
 * Finds expired leases and reassigns tasks
 *
 * Prevents stalled devices from blocking tasks
 */

import { db } from '../../lib/dynamodb.mjs';
import broadcast from '../../lib/broadcast.mjs';
import { TABLES } from '../../schema.mjs';

export async function sweepHandler(event) {
  const now = Date.now();

  try {
    // 1. Scan all leased tasks
    const leased = await db.scanTable(
      TABLES.TASKS,
      '#state = :leased',
      { ':leased': 'leased' },
      { '#state': 'state' }
    );

    const results = {
      reassigned: 0,
      exhausted: 0,
      errors: []
    };

    const MAX_ATTEMPTS = 3;

    // 2. Check each task for expiry
    for (const task of leased) {
      if (!task.leaseExpiry || task.leaseExpiry > now) {
        // Lease still valid
        continue;
      }

      // Lease expired
      const attempts = (task.attempts || 0) + 1;

      if (attempts >= MAX_ATTEMPTS) {
        // Max retries - mark as failed
        try {
          await db.updateItem(
            TABLES.TASKS,
            { projectId: task.projectId, sk: task.sk },
            'SET #state = :failed, attempts = :att',
            { '#state': 'state' },
            { ':failed': 'failed', ':att': attempts }
          );

          await broadcast({
            type: 'task.discarded_stale',
            projectId: task.projectId,
            taskId: task.taskId,
            reason: 'max_attempts',
            attempts,
            ts: now
          });

          results.exhausted++;
        } catch (err) {
          results.errors.push({ taskId: task.taskId, error: err.message });
        }
      } else {
        // Reassign: back to ready state
        try {
          await db.updateItem(
            TABLES.TASKS,
            { projectId: task.projectId, sk: task.sk },
            'SET #state = :ready, leaseEpoch = :epoch, attempts = :att REMOVE leaseOwner',
            { '#state': 'state' },
            {
              ':ready': 'ready',
              ':epoch': (task.leaseEpoch || 0) + 1,
              ':att': attempts
            }
          );

          await broadcast({
            type: 'task.reassigned',
            projectId: task.projectId,
            taskId: task.taskId,
            from: task.leaseOwner,
            to: 'pool',
            reason: 'lease_expired',
            attempts,
            ts: now
          });

          results.reassigned++;
        } catch (err) {
          results.errors.push({ taskId: task.taskId, error: err.message });
        }
      }
    }

    console.log('[SWEEP]', results);

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (err) {
    console.error('Sweep error:', err);
    // Don't fail - sweep should be resilient
    return {
      statusCode: 200,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default sweepHandler;
