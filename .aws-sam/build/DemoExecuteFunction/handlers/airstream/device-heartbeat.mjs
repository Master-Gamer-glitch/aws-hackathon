/**
 * Device heartbeat & offline detection
 * If device offline > threshold, redistribute its tasks
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';

const OFFLINE_THRESHOLD_MS = 30000; // 30 seconds
const HEARTBEAT_CHECK_INTERVAL_MS = 5000; // Check every 5s

async function detectOfflineDevices(roomId) {
  const now = Date.now();
  const devices = await db.query(TABLES.DEVICES, {
    indexName: 'RoomIndex',
    keyConditionExpression: 'roomId = :roomId',
    expressionAttributeValues: {
      ':roomId': roomId
    }
  });

  const offlineDevices = [];
  const onlineDevices = [];

  for (const device of devices) {
    if (!device.isMaster) {
      const timeSinceHeartbeat = now - device.lastHeartbeat;

      if (timeSinceHeartbeat > OFFLINE_THRESHOLD_MS) {
        // Device is offline
        offlineDevices.push(device);

        // Mark as offline if not already
        if (device.status !== 'offline') {
          await db.updateItem(TABLES.DEVICES, { deviceId: device.deviceId }, {
            status: 'offline',
            offlineStartTime: device.offlineStartTime || now
          });
          console.log(`[OFFLINE] Device ${device.deviceId} offline for ${timeSinceHeartbeat}ms`);
          // Broadcast will be sent from handler with projectId context
        }
      } else {
        onlineDevices.push(device);

        // Clear offline timer if it comes back
        if (device.status === 'offline') {
          await db.updateItem(TABLES.DEVICES, { deviceId: device.deviceId }, {
            status: 'online',
            offlineStartTime: null
          });
          console.log(`[ONLINE] Device ${device.deviceId} back online`);
        }
      }
    }
  }

  return { offlineDevices, onlineDevices };
}

async function redistributeTasks(roomId, offlineDeviceIds) {
  if (offlineDeviceIds.length === 0) return;

  console.log(`[REDISTRIBUTE] Reassigning tasks from offline devices: ${offlineDeviceIds.join(', ')}`);

  // Get all tasks assigned to offline devices in this room
  for (const deviceId of offlineDeviceIds) {
    const tasksToRedistribute = await db.query(TABLES.TASKS, {
      indexName: 'DeviceIndex',
      keyConditionExpression: 'leaseOwner = :deviceId',
      expressionAttributeValues: {
        ':deviceId': deviceId
      }
    });

    for (const task of tasksToRedistribute) {
      if (task.state === 'leased') {
        // Reset task to ready state
        await db.updateItem(TABLES.TASKS,
          { projectId: task.projectId, sk: task.sk },
          {
            state: 'ready',
            leaseOwner: null,
            leaseExpiry: null,
            leaseEpoch: task.leaseEpoch + 1,
            failedAttempts: (task.failedAttempts || 0) + 1
          }
        );

        console.log(`[TASK] Reset ${task.taskId} (epoch ${task.leaseEpoch + 1}) due to device offline`);
      }
    }
  }
}

export async function deviceHeartbeatHandler(event) {
  const { projectId, roomId, deviceId } = event.pathParameters;
  const { status = 'ok', metrics = {} } = JSON.parse(event.body || '{}');

  const now = Date.now();

  try {
    // Update device heartbeat
    await db.updateItem(TABLES.DEVICES, { deviceId }, {
      lastHeartbeat: now,
      status: 'online',
      offlineStartTime: null,
      metrics,
      expiresAt: now + 86400000
    });

    // Periodically check all devices in room for offline status
    const { offlineDevices, onlineDevices } = await detectOfflineDevices(roomId);

    for (const device of offlineDevices) {
      if (device.status === 'offline' && !device.broadcastedOffline) {
        await broadcast(events.deviceOffline(projectId, device.deviceId, device.name));
      }
    }

    if (offlineDevices.length > 0) {
      const offlineIds = offlineDevices.map(d => d.deviceId);

      // Check if they've been offline for long enough to trigger redistribution
      for (const device of offlineDevices) {
        const offlineTime = now - (device.offlineStartTime || now);
        if (offlineTime > OFFLINE_THRESHOLD_MS) {
          await redistributeTasks(roomId, [device.deviceId]);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        deviceId,
        timestamp: now,
        onlineDeviceCount: onlineDevices.length + 1, // +1 for master
        offlineDeviceCount: offlineDevices.length,
        tasksRedistributed: offlineDevices.length > 0
      })
    };
  } catch (err) {
    console.error('Heartbeat error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default deviceHeartbeatHandler;
