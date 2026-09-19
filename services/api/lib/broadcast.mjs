import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { db } from './dynamodb.mjs';
import { TABLES } from '../schema.mjs';

const apiGw = new ApiGatewayManagementApiClient({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

export async function broadcast(event) {
  const projectId = event.projectId || 'default';

  try {
    // Fetch all active connections for this project
    const connections = await db.queryTable(
      TABLES.CONNECTIONS,
      'projectId = :projectId',
      { ':projectId': projectId }
    );

    console.log(`[BROADCAST] ${event.type} → ${connections.length} connections`);

    const message = JSON.stringify(event);
    const payload = new TextEncoder().encode(message);

    // Send to each connection
    const results = await Promise.allSettled(
      connections.map(conn =>
        apiGw.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: payload
        }))
      )
    );

    // Log failures (connection might be dead)
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.log(`[BROADCAST] ${failures.length} failures (dead connections)`);
    }

    return {
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: failures.length
    };
  } catch (err) {
    console.error('[BROADCAST] Error:', err);
    // Don't fail - broadcast is best-effort
    return { sent: 0, failed: 0, error: err.message };
  }
}

// One-liner event formatters
export const events = {
  roomCreated: (roomId, masterId) => ({
    type: 'room.created',
    projectId: 'default',
    message: `🏠 Room created: ${roomId} (master: ${masterId})`
  }),

  deviceJoined: (projectId, deviceId, name, tools) => ({
    type: 'device.joined',
    projectId,
    message: `✅ Device joined: ${name} (${deviceId}) → ${tools.slice(0, 3).join(', ')}${tools.length > 3 ? ', ...' : ''}`
  }),

  deviceOnline: (projectId, deviceId, name) => ({
    type: 'device.online',
    projectId,
    message: `🟢 Device online: ${name} (${deviceId})`
  }),

  deviceOffline: (projectId, deviceId, name) => ({
    type: 'device.offline',
    projectId,
    message: `🔴 Device offline: ${name} (${deviceId})`
  }),

  taskAssigned: (projectId, taskId, objective, deviceId, deviceName, fitScore) => ({
    type: 'task.assigned',
    projectId,
    message: `📋 Task: "${objective.substring(0, 40)}${objective.length > 40 ? '...' : ''}" → ${deviceName} (fit: ${fitScore.toFixed(2)})`
  }),

  tasksDistributed: (projectId, count, failed) => ({
    type: 'tasks.distributed',
    projectId,
    message: `🎯 Distributed ${count} tasks${failed > 0 ? ` (${failed} unassigned)` : ''}`
  }),

  taskCompleted: (projectId, taskId, objective, deviceId) => ({
    type: 'task.completed',
    projectId,
    message: `✨ Task done: "${objective.substring(0, 40)}${objective.length > 40 ? '...' : ''}" on ${deviceId}`
  }),

  taskFailed: (projectId, taskId, objective, deviceId, reason) => ({
    type: 'task.failed',
    projectId,
    message: `❌ Task failed: "${objective.substring(0, 30)}..." on ${deviceId} (${reason})`
  }),

  taskRedistributed: (projectId, taskId, objective, fromDevice, toDevice) => ({
    type: 'task.redistributed',
    projectId,
    message: `🔄 Task reassigned: "${objective.substring(0, 30)}..." ${fromDevice} → ${toDevice}`
  }),

  codeCollecting: (projectId, deviceCount, taskCount) => ({
    type: 'code.collecting',
    projectId,
    message: `📦 Collecting code from ${deviceCount} devices (${taskCount} completed tasks)...`
  }),

  codeCollected: (projectId, filesCount) => ({
    type: 'code.collected',
    projectId,
    message: `📂 Code integrated: ${filesCount} files merged on master`
  }),

  demoStarting: (projectId, projectType) => ({
    type: 'demo.starting',
    projectId,
    message: `🚀 Demo starting (${projectType})...`
  }),

  demoCompleted: (projectId, projectType, runtime, exitCode) => ({
    type: 'demo.completed',
    projectId,
    message: `✅ Demo complete (${projectType}) in ${runtime}ms [exit: ${exitCode}]`
  }),

  demoFailed: (projectId, error) => ({
    type: 'demo.failed',
    projectId,
    message: `💥 Demo failed: ${error}`
  }),

  statusUpdate: (projectId, state, onlineDevices, totalDevices, committedTasks, totalTasks) => ({
    type: 'status.update',
    projectId,
    message: `📊 ${state} | Devices: ${onlineDevices}/${totalDevices} | Tasks: ${committedTasks}/${totalTasks}`
  })
};

export default broadcast;
