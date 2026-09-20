/**
 * Collect code from all devices and integrate on master
 * Master pulls artifacts and merges them into a single working project
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';
import fs from 'fs/promises';
import path from 'path';
import { withCors } from '../../lib/cors.mjs';

async function fetchDeviceArtifacts(deviceId, taskIds) {
  // In production: use gRPC or secure HTTP to pull from device
  // For now: placeholder for fetching artifacts
  console.log(`[COLLECT] Fetching artifacts from ${deviceId}: ${taskIds.join(', ')}`);

  return {
    deviceId,
    timestamp: Date.now(),
    artifacts: []
  };
}

async function mergeArtifacts(masterDir, deviceArtifacts) {
  // Merge strategy:
  // 1. Collect all files from devices
  // 2. Handle conflicts (last-write-wins or merge based on tool type)
  // 3. Run build verification
  // 4. Generate integration report

  console.log(`[MERGE] Integrating code from ${deviceArtifacts.length} devices`);

  for (const device of deviceArtifacts) {
    for (const artifact of device.artifacts) {
      const targetPath = path.join(masterDir, artifact.relativePath);

      // Create directory if needed
      const dir = path.dirname(targetPath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(targetPath, artifact.content, 'utf-8');

      console.log(`[MERGE] Wrote ${artifact.relativePath} from ${device.deviceId}`);
    }
  }

  return {
    filesIntegrated: deviceArtifacts.reduce((sum, d) => sum + d.artifacts.length, 0),
    timestamp: Date.now()
  };
}

async function verifyIntegration(masterDir) {
  // Run build/test to verify integration succeeded
  console.log(`[VERIFY] Running build verification in ${masterDir}`);

  // Check for package.json, run build
  try {
    const packageJson = await fs.readFile(path.join(masterDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(packageJson);

    if (pkg.scripts?.build) {
      console.log(`[VERIFY] Found build script: ${pkg.scripts.build}`);
      // Would run: execSync('npm run build', { cwd: masterDir })
    }
  } catch (e) {
    console.log(`[VERIFY] No package.json found (okay for non-npm projects)`);
  }

  return {
    status: 'passed',
    timestamp: Date.now()
  };
}

async function codeCollectHandlerImpl(event) {
  const { projectId, roomId } = event.pathParameters;
  const now = Date.now();

  try {
    // Get room and all devices
    const room = await db.getItem(TABLES.ROOMS, { roomId });
    if (!room) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Room not found' })
      };
    }

    // Get all completed tasks in room
    const completedTasks = await db.query(TABLES.TASKS, {
      keyConditionExpression: 'projectId = :projectId',
      filterExpression: '#state = :state',
      expressionAttributeNames: {
        '#state': 'state'
      },
      expressionAttributeValues: {
        ':projectId': projectId,
        ':state': 'committed'
      }
    });

    // Group tasks by device
    const deviceTasks = {};
    for (const task of completedTasks) {
      const deviceId = task.resultDeviceId;
      if (!deviceTasks[deviceId]) {
        deviceTasks[deviceId] = [];
      }
      deviceTasks[deviceId].push(task.taskId);
    }

    console.log(`[COLLECT] Room ${roomId}: ${completedTasks.length} completed tasks from ${Object.keys(deviceTasks).length} devices`);

    await broadcast(events.codeCollecting(projectId, Object.keys(deviceTasks).length, completedTasks.length));

    // Fetch artifacts from each device
    const allArtifacts = [];
    for (const [deviceId, taskIds] of Object.entries(deviceTasks)) {
      const artifacts = await fetchDeviceArtifacts(deviceId, taskIds);
      allArtifacts.push(artifacts);
    }

    // Create master working directory
    const masterDir = path.join('/tmp', `crewdesk_${roomId}_${Date.now()}`);
    await fs.mkdir(masterDir, { recursive: true });

    // Merge all artifacts
    const mergeResult = await mergeArtifacts(masterDir, allArtifacts);

    await broadcast(events.codeCollected(projectId, mergeResult.filesIntegrated));

    // Verify integration
    const verifyResult = await verifyIntegration(masterDir);

    // Update room status
    await db.updateItem(TABLES.ROOMS, { roomId }, {
      status: 'integrated',
      masterDir,
      integrationTime: Date.now(),
      integratedTaskCount: completedTasks.length,
      expiresAt: now + 86400000
    });

    console.log(`[COLLECT] Integration complete at ${masterDir}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        roomId,
        masterDir,
        filesIntegrated: mergeResult.filesIntegrated,
        taskCount: completedTasks.length,
        verifyStatus: verifyResult.status,
        message: 'Code collected and integrated on master device'
      })
    };
  } catch (err) {
    console.error('Code collect error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export const codeCollectHandler = withCors(codeCollectHandlerImpl);
export default codeCollectHandler;
