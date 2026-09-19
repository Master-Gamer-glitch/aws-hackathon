/**
 * Get room status: devices, tasks, progress
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';

export async function roomStatusHandler(event) {
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

    const deviceStats = {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      devices: devices.map(d => ({
        deviceId: d.deviceId,
        name: d.name,
        status: d.status,
        isMaster: d.isMaster,
        capabilities: d.capabilities,
        lastHeartbeat: d.lastHeartbeat,
        offlineSince: d.offlineStartTime
      }))
    };

    // Get task stats
    const readyTasks = await db.query(TABLES.TASKS, {
      indexName: 'StateIndex',
      keyConditionExpression: 'projectId = :projectId AND #state = :state',
      expressionAttributeNames: { '#state': 'state' },
      expressionAttributeValues: {
        ':projectId': projectId,
        ':state': 'ready'
      }
    });

    const leasedTasks = await db.query(TABLES.TASKS, {
      indexName: 'StateIndex',
      keyConditionExpression: 'projectId = :projectId AND #state = :state',
      expressionAttributeNames: { '#state': 'state' },
      expressionAttributeValues: {
        ':projectId': projectId,
        ':state': 'leased'
      }
    });

    const committedTasks = await db.query(TABLES.TASKS, {
      indexName: 'StateIndex',
      keyConditionExpression: 'projectId = :projectId AND #state = :state',
      expressionAttributeNames: { '#state': 'state' },
      expressionAttributeValues: {
        ':projectId': projectId,
        ':state': 'committed'
      }
    });

    const failedTasks = await db.query(TABLES.TASKS, {
      indexName: 'StateIndex',
      keyConditionExpression: 'projectId = :projectId AND #state = :state',
      expressionAttributeNames: { '#state': 'state' },
      expressionAttributeValues: {
        ':projectId': projectId,
        ':state': 'failed'
      }
    });

    const taskStats = {
      ready: readyTasks.length,
      leased: leasedTasks.length,
      committed: committedTasks.length,
      failed: failedTasks.length,
      total: readyTasks.length + leasedTasks.length + committedTasks.length + failedTasks.length,
      progress: committedTasks.length > 0
        ? ((committedTasks.length / (readyTasks.length + leasedTasks.length + committedTasks.length + failedTasks.length)) * 100).toFixed(1)
        : 0
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
        masterDir: room.masterDir || null
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

export default roomStatusHandler;
