/**
 * Device joins Airstream room
 * Evaluates capabilities: CPU, RAM, installed tools, network speed
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';
import { os, v8 } from 'node:os';
import { execSync } from 'node:child_process';

function detectCapabilities() {
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  const cpuModel = cpus[0]?.model || 'unknown';

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsedPercent = ((memTotal - memFree) / memTotal) * 100;

  // Benchmark score (1-10 scale)
  const benchScore = Math.min(10, cpuCount / 4 + (memTotal / (8 * 1024 * 1024 * 1024)));

  // Detect installed tools
  const tools = [];
  const toolChecks = {
    'node': 'node --version',
    'python': 'python3 --version',
    'git': 'git --version',
    'docker': 'docker --version',
    'npm': 'npm --version',
    'go': 'go version',
    'rust': 'rustc --version'
  };

  for (const [tool, cmd] of Object.entries(toolChecks)) {
    try {
      execSync(cmd, { stdio: 'ignore' });
      tools.push(tool);
    } catch (e) {
      // Tool not found
    }
  }

  return {
    platform: os.platform(),
    arch: os.arch(),
    cpuCount,
    cpuModel,
    memTotalGb: (memTotal / (1024 * 1024 * 1024)).toFixed(1),
    memFreeGb: (memFree / (1024 * 1024 * 1024)).toFixed(1),
    memUsedPercent: memUsedPercent.toFixed(1),
    benchScore: parseFloat(benchScore.toFixed(1)),
    tools,
    nodeVersion: process.version
  };
}

function calculateTaskFit(capabilities, taskContract) {
  let score = 0;
  const weight = {
    cpuCore: 0.2,
    memory: 0.2,
    tools: 0.4,
    benchScore: 0.2
  };

  // CPU score (more cores = better)
  const cpuScore = Math.min(1, capabilities.cpuCount / 8);
  score += cpuScore * weight.cpuCore;

  // Memory score
  const memScore = Math.min(1, capabilities.memFreeGb / 8);
  score += memScore * weight.memory;

  // Tool availability
  const requiredTools = taskContract.requiredTools || [];
  const toolScore = requiredTools.length === 0
    ? 1
    : requiredTools.filter(t => capabilities.tools.includes(t)).length / requiredTools.length;
  score += toolScore * weight.tools;

  // Benchmark score (normalized)
  score += (capabilities.benchScore / 10) * weight.benchScore;

  return score; // 0-1
}

export async function deviceJoinHandler(event) {
  const { projectId, roomId } = event.pathParameters;
  const { deviceId, deviceName } = JSON.parse(event.body);

  const now = Date.now();

  try {
    // Get room to verify it exists
    const room = await db.getItem(TABLES.ROOMS, { roomId });
    if (!room) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Room not found' })
      };
    }

    // Detect device capabilities
    const capabilities = detectCapabilities();

    // Register device
    await db.putItem(TABLES.DEVICES, {
      deviceId,
      roomId,
      projectId,
      name: deviceName,
      isMaster: false,
      status: 'online',
      capabilities,
      taskFitCalculator: calculateTaskFit.toString(), // Store logic
      lastHeartbeat: now,
      lastHealthCheck: now,
      offlineThresholdMs: 30000, // 30s threshold
      offlineStartTime: null,
      expiresAt: now + 86400000 // 24h TTL
    });

    // Add device to room
    const updatedDevices = [...(room.devices || []), deviceId];
    await db.updateItem(TABLES.ROOMS, { roomId }, {
      devices: updatedDevices,
      updatedAt: now
    });

    console.log(`[AIRSTREAM] Device ${deviceId} joined room ${roomId}`);
    console.log(`Capabilities:`, capabilities);

    await broadcast(events.deviceJoined(projectId, deviceId, deviceName, capabilities.tools));

    return {
      statusCode: 200,
      body: JSON.stringify({
        deviceId,
        roomId,
        capabilities,
        message: 'Device joined. Ready for task assignment.'
      })
    };
  } catch (err) {
    console.error('Device join error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default deviceJoinHandler;
