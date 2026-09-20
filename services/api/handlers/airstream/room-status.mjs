/**
 * Get room status: devices, tasks, progress
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import { withCors } from '../../lib/cors.mjs';
import { tasksForRoom } from '../../lib/contracts.mjs';
import { effectiveStatus } from '../../lib/devices.mjs';

async function roomStatusHandlerImpl(event) {
  const { projectId, roomId } = event.pathParameters;

  try {
    const room = await db.getItem(TABLES.ROOMS, { roomId });
    if (!room) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Room not found' })
      };
    }

    // Get all devices in room
    const devices = await db.query(TABLES.DEVICES, {
      indexName: 'RoomIndex',
      keyConditionExpression: 'roomId = :roomId',
      expressionAttributeValues: {
        ':roomId': roomId
      }
    });

    const now = Date.now();
    const statusOf = (d) => effectiveStatus(d, now); // stale heartbeat means offline, whatever is stored
    const deviceStats = {
      total: devices.length,
      online: devices.filter(d => statusOf(d) === 'online').length,
      offline: devices.filter(d => statusOf(d) === 'offline').length,
      devices: devices.map(d => ({
        deviceId: d.deviceId,
        name: d.name,
        status: statusOf(d),
        isMaster: d.isMaster,
        capabilities: d.capabilities,
        lastHeartbeat: d.lastHeartbeat,
        metrics: d.metrics || null,
        offlineSince: d.offlineStartTime
      }))
    };

    // Tasks this room works on: its current plan, plus project-level tasks with no room
    const allTasks = tasksForRoom(await db.query(TABLES.TASKS, {
      keyConditionExpression: 'projectId = :projectId',
      expressionAttributeValues: { ':projectId': projectId }
    }), room);
    const inState = (...states) => allTasks.filter((t) => states.includes(t.state));
    const readyTasks = inState('ready');
    const leasedTasks = inState('leased', 'submitted', 'verifying'); // in a device's hands
    const committedTasks = inState('committed');
    const failedTasks = inState('failed');

    const total = readyTasks.length + leasedTasks.length + committedTasks.length + failedTasks.length;
    const taskStats = {
      ready: readyTasks.length,
      leased: leasedTasks.length,
      committed: committedTasks.length,
      failed: failedTasks.length,
      total,
      progress: committedTasks.length > 0 ? ((committedTasks.length / total) * 100).toFixed(1) : 0
    };

    // Lease distribution
    const leaseByDevice = {};
    for (const task of leasedTasks) {
      const deviceId = task.leaseOwner;
      leaseByDevice[deviceId] = (leaseByDevice[deviceId] || 0) + 1;
    }

    const timelineData = {
      createdAt: room.createdAt,
      roomAge: Date.now() - room.createdAt,
      lastUpdate: room.updatedAt || room.createdAt
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        roomId,
        projectId,
        status: room.status,
        masterDevice: {
          deviceId: room.masterDeviceId,
          name: room.masterDeviceName
        },
        deviceStats,
        taskStats,
        leaseDistribution: leaseByDevice,
        timeline: timelineData,
        demoStatus: room.demoResult || null,
        masterDir: room.masterDir || null,
        planId: room.planId || null,
        outcome: room.outcome || null
      })
    };
  } catch (err) {
    console.error('Status error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export const roomStatusHandler = withCors(roomStatusHandlerImpl);
export default roomStatusHandler;
