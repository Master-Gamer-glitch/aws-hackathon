/**
 * Master distributes tasks to devices based on capabilities
 * Greedy bin-packing algorithm: assign to best-fit device
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';
import { withCors } from '../../lib/cors.mjs';
import { tasksForRoom } from '../../lib/contracts.mjs';

function calculateTaskFitScore(device, task) {
  if (!device.capabilities || device.status !== 'online') return -1;

  let score = 0;
  const weights = {
    cpuCore: 0.15,
    memory: 0.15,
    tools: 0.5,
    benchmark: 0.2
  };

  // CPU fitness
  const requiredCpuCores = task.contract?.requiredCpuCores || 2;
  const cpuScore = Math.min(1, device.capabilities.cpuCount / requiredCpuCores);
  score += cpuScore * weights.cpuCore;

  // Memory fitness
  const requiredMemGb = task.contract?.requiredMemGb || 4;
  const memScore = Math.min(1, parseFloat(device.capabilities.memFreeGb) / requiredMemGb);
  score += memScore * weights.memory;

  // Tool availability (most important)
  const requiredTools = task.contract?.requiredTools || [];
  if (requiredTools.length === 0) {
    score += weights.tools;
  } else {
    const toolsAvailable = requiredTools.filter(tool =>
      device.capabilities.tools.includes(tool)
    ).length;
    const toolScore = toolsAvailable / requiredTools.length;
    score += toolScore * weights.tools;

    // Penalty if missing critical tools
    if (toolScore < 1) {
      score *= 0.5;
    }
  }

  // Benchmark score
  score += (device.capabilities.benchScore / 10) * weights.benchmark;

  return score;
}

async function findBestDevice(devices, task) {
  let bestDevice = null;
  let bestScore = -1;

  for (const device of devices) {
    const score = calculateTaskFitScore(device, task);
    if (score > bestScore) {
      bestScore = score;
      bestDevice = device;
    }
  }

  return { device: bestDevice, score: bestScore };
}

async function distributeTasksInRoom(roomId) {
  console.log(`[DISTRIBUTE] Starting task distribution for room ${roomId}`);

  try {
    // Get all online devices in room (excluding master)
    const devices = await db.query(TABLES.DEVICES, {
      indexName: 'RoomIndex',
      keyConditionExpression: 'roomId = :roomId',
      expressionAttributeValues: {
        ':roomId': roomId
      }
    });

    const onlineDevices = devices.filter(d =>
      d.status === 'online' && !d.isMaster
    );

    if (onlineDevices.length === 0) {
      console.log(`[DISTRIBUTE] No online devices in room ${roomId}`);
      return { distributed: 0, failed: 0 };
    }

    // Get all ready tasks in projects using this room
    const room = await db.getItem(TABLES.ROOMS, { roomId });
    if (!room) {
      const e = new Error('Room not found');
      e.statusCode = 404;
      throw e;
    }
    const projectId = room.projectId;

    const readyTasks = tasksForRoom(await db.query(TABLES.TASKS, {
      keyConditionExpression: 'projectId = :projectId',
      filterExpression: '#state = :state',
      expressionAttributeNames: {
        '#state': 'state'
      },
      expressionAttributeValues: {
        ':projectId': projectId,
        ':state': 'ready'
      }
    }), room);

    let distributed = 0;
    let failed = 0;

    for (const task of readyTasks) {
      const { device, score } = await findBestDevice(onlineDevices, task);

      if (!device) {
        console.log(`[TASK] No suitable device for task ${task.taskId}`);
        failed++;
        continue;
      }

      if (score < 0.3) {
        // Poor fit, don't assign
        console.log(`[TASK] Device fit score too low (${score.toFixed(2)}) for ${task.taskId}`);
        failed++;
        continue;
      }

      // Assign task to device
      const leaseExpiry = Date.now() + 300000; // 5 minute lease
      await db.updateItem(TABLES.TASKS,
        { projectId: task.projectId, sk: task.sk },
        {
          state: 'leased',
          leaseOwner: device.deviceId,
          leaseExpiry,
          leaseEpoch: (task.leaseEpoch || 0) + 1,
          assignedAt: Date.now()
        }
      );

      console.log(`[ASSIGN] ${task.taskId} → ${device.deviceId} (fit: ${score.toFixed(2)})`);
      await broadcast(events.taskAssigned(projectId, task.taskId, task.contract?.objective || 'Task', device.deviceId, device.name, score));
      distributed++;
    }

    console.log(`[DISTRIBUTE] Completed: ${distributed} assigned, ${failed} unassigned`);
    await broadcast(events.tasksDistributed(projectId, distributed, failed));
    return { distributed, failed };

  } catch (err) {
    console.error('Distribution error:', err);
    throw err;
  }
}

async function taskDistributeHandlerImpl(event) {
  const { projectId, roomId } = event.pathParameters;

  try {
    const result = await distributeTasksInRoom(roomId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        roomId,
        tasksDistributed: result.distributed,
        tasksFailed: result.failed,
        timestamp: Date.now()
      })
    };
  } catch (err) {
    console.error('Distribute handler error:', err);
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export { distributeTasksInRoom };
export const taskDistributeHandler = withCors(taskDistributeHandlerImpl);
export default taskDistributeHandler;
