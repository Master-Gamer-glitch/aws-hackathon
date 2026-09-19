/**
 * Execute demo on master device
 * Start dev server, API, or main executable and stream output
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

async function detectProjectType(projectDir) {
  // Check for project markers
  const files = await fs.readdir(projectDir);

  if (files.includes('package.json')) {
    return 'nodejs';
  }
  if (files.includes('go.mod')) {
    return 'go';
  }
  if (files.includes('Cargo.toml')) {
    return 'rust';
  }
  if (files.includes('main.py') || files.includes('app.py')) {
    return 'python';
  }
  if (files.includes('Dockerfile')) {
    return 'docker';
  }

  return 'unknown';
}

async function getLaunchCommand(projectDir, projectType) {
  switch (projectType) {
    case 'nodejs': {
      try {
        const pkg = JSON.parse(
          await fs.readFile(path.join(projectDir, 'package.json'), 'utf-8')
        );
        if (pkg.scripts?.dev) return ['npm', ['run', 'dev'], { cwd: projectDir }];
        if (pkg.scripts?.start) return ['npm', ['start'], { cwd: projectDir }];
        if (pkg.main) return ['node', [pkg.main], { cwd: projectDir }];
      } catch (e) {
        console.error('Error reading package.json:', e);
      }
      return ['npm', ['start'], { cwd: projectDir }];
    }

    case 'go': {
      return ['go', ['run', '.'], { cwd: projectDir }];
    }

    case 'rust': {
      return ['cargo', ['run', '--release'], { cwd: projectDir }];
    }

    case 'python': {
      return ['python3', [path.join(projectDir, 'main.py')], { cwd: projectDir }];
    }

    case 'docker': {
      return ['docker-compose', ['up'], { cwd: projectDir }];
    }

    default: {
      return null;
    }
  }
}

function executeProject(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, {
      ...options,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    const startTime = Date.now();
    const maxRunTime = 120000; // 2 minute timeout

    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      console.log(`[DEMO-STDOUT] ${chunk}`);
    });

    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      console.log(`[DEMO-STDERR] ${chunk}`);
    });

    // Auto-kill after timeout
    const timeout = setTimeout(() => {
      console.log(`[DEMO] Timeout after ${maxRunTime}ms, terminating`);
      process.kill('SIGTERM');
    }, maxRunTime);

    process.on('close', (code) => {
      clearTimeout(timeout);
      resolve({
        exitCode: code,
        stdout,
        stderr,
        runtime: Date.now() - startTime,
        success: code === 0 || code === 143 // 143 = SIGTERM (timeout)
      });
    });

    process.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function demoExecuteHandler(event) {
  const { projectId, roomId } = event.pathParameters;
  const now = Date.now();

  try {
    // Get room and integrated project
    const room = await db.getItem(TABLES.ROOMS, { roomId });
    if (!room || !room.masterDir) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Room not integrated yet. Run code collection first.' })
      };
    }

    const projectDir = room.masterDir;

    // Detect project type
    const projectType = await detectProjectType(projectDir);
    console.log(`[DEMO] Detected project type: ${projectType}`);
    await broadcast(events.demoStarting(projectId, projectType));

    if (projectType === 'unknown') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Could not detect project type' })
      };
    }

    // Get launch command
    const launchCmd = await getLaunchCommand(projectDir, projectType);
    if (!launchCmd) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `No launch command for ${projectType}` })
      };
    }

    const [cmd, args, options] = launchCmd;
    console.log(`[DEMO] Launching: ${cmd} ${args.join(' ')}`);

    // Execute project
    const result = await executeProject(cmd, args, options);

    // Store demo result
    await db.updateItem(TABLES.ROOMS, { roomId }, {
      status: 'demo_executed',
      demoResult: {
        projectType,
        command: `${cmd} ${args.join(' ')}`,
        exitCode: result.exitCode,
        runtime: result.runtime,
        success: result.success,
        outputSize: result.stdout.length
      },
      demoExecutedAt: Date.now(),
      expiresAt: now + 86400000
    });

    console.log(`[DEMO] Complete. Exit code: ${result.exitCode}, Runtime: ${result.runtime}ms`);
    await broadcast(events.demoCompleted(projectId, projectType, result.runtime, result.exitCode));

    return {
      statusCode: 200,
      body: JSON.stringify({
        roomId,
        projectType,
        command: `${cmd} ${args.join(' ')}`,
        exitCode: result.exitCode,
        runtime: result.runtime,
        success: result.success,
        outputLength: result.stdout.length + result.stderr.length,
        message: `Demo executed in ${result.runtime}ms on ${projectType} project`
      })
    };
  } catch (err) {
    console.error('Demo execute error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

export default demoExecuteHandler;
