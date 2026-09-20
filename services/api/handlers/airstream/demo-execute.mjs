/**
 * POST /projects/{projectId}/rooms/{roomId}/demo
 *
 * Run the project that collect merged (s3://{bucket}/rooms/{roomId}/integrated/).
 *
 * How it runs:
 *  - the merged files are downloaded into a scratch folder in this instance's /tmp
 *  - Node.js (package.json) and Python (main.py / app.py) projects are executed; a plain
 *    index.html site is reported as static; Go, Rust and Docker are not available in Lambda
 *  - the child process gets a SCRUBBED environment. The Lambda's AWS credentials live in its
 *    environment variables, and submitted code must never be able to read them.
 *  - API Gateway cuts REST requests off at 29 s, so the whole run is budgeted to stay under
 *    that. A server that is still running when the budget ends is stopped and counts as a
 *    successful start (`timedOut: true`), which is the normal outcome for a dev server.
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';
import { withCors } from '../../lib/cors.mjs';
import { listObjects, getObject } from '../../lib/artifacts.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const TOTAL_BUDGET_MS = 24_000;   // leaves headroom under API Gateway's 29 s limit
const INSTALL_BUDGET_MS = 14_000; // npm install gets at most this much of the budget
const MIN_RUN_MS = 3_000;         // never start the project with less than this left
const OUTPUT_TAIL_CHARS = 4_000;  // how much output goes back to the caller
const OUTPUT_KEEP_CHARS = 64_000; // how much output is held in memory while running

/** Only what a project legitimately needs. No AWS_* variables, no Lambda internals. */
function sandboxEnv() {
  return {
    PATH: process.env.PATH,
    HOME: '/tmp',
    TMPDIR: '/tmp',
    LANG: 'C.UTF-8',
    CI: '1',
    PORT: '3000',
    npm_config_cache: '/tmp/.npm',
    npm_config_update_notifier: 'false',
    npm_config_fund: 'false',
    npm_config_audit: 'false',
  };
}

/** Download every merged file into `dir`. Refuses any path that would land outside it. */
async function downloadProject(prefix, dir) {
  const objects = await listObjects(prefix);
  const root = path.resolve(dir);
  for (const obj of objects) {
    const rel = obj.key.slice(prefix.length);
    if (!rel) continue;
    const target = path.resolve(root, rel);
    if (target !== root && !target.startsWith(root + path.sep)) continue; // path escape: skip
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, await getObject(obj.key));
  }
  return objects.map((o) => o.key.slice(prefix.length)).filter(Boolean);
}

const exists = (p) => fs.access(p).then(() => true, () => false);

async function detectProjectType(dir, files) {
  if (files.includes('package.json')) return 'nodejs';
  if (files.includes('go.mod')) return 'go';
  if (files.includes('Cargo.toml')) return 'rust';
  if (files.includes('main.py') || files.includes('app.py')) return 'python';
  if (files.includes('Dockerfile')) return 'docker';
  if (files.includes('index.html')) return 'static';
  return 'unknown';
}

/** Run a command for at most `budgetMs`. Never rejects: a missing binary comes back as spawnError. */
function run(cmd, args, { cwd, budgetMs }) {
  return new Promise((resolve) => {
    const started = Date.now();
    let output = '';
    let timedOut = false;
    let settled = false;

    const done = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ output, runtime: Date.now() - started, timedOut, ...r });
    };

    const keep = (chunk) => {
      output += chunk.toString();
      if (output.length > OUTPUT_KEEP_CHARS) output = output.slice(-OUTPUT_KEEP_CHARS);
    };

    let child;
    try {
      // detached = its own process group, so a timeout can stop `npm start` AND the server it launched
      child = spawn(cmd, args, { cwd, env: sandboxEnv(), stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    } catch (err) {
      return resolve({ output, runtime: 0, timedOut: false, spawnError: err.code || err.message, exitCode: null });
    }

    const killGroup = (signal) => {
      try { process.kill(-child.pid, signal); } catch { try { child.kill(signal); } catch { /* already gone */ } }
    };

    child.stdout.on('data', keep);
    child.stderr.on('data', keep);

    const timer = setTimeout(() => {
      timedOut = true;
      killGroup('SIGTERM');
      setTimeout(() => killGroup('SIGKILL'), 1000).unref();
    }, budgetMs);

    child.on('error', (err) => done({ spawnError: err.code || err.message, exitCode: null }));
    // 'close' waits for the pipes; a stray grandchild could hold them open, so also settle shortly after 'exit'
    child.on('exit', (code, signal) => setTimeout(() => done({ exitCode: code, signal }), 300));
    child.on('close', (code, signal) => done({ exitCode: code, signal }));
  });
}

const tail = (s) => (s.length > OUTPUT_TAIL_CHARS ? '…' + s.slice(-OUTPUT_TAIL_CHARS) : s);
const fail = (statusCode, error, extra = {}) => ({ statusCode, body: JSON.stringify({ error, ...extra }) });

async function demoExecuteHandlerImpl(event) {
  const { projectId, roomId } = event.pathParameters;
  const started = Date.now();

  const room = await db.getItem(TABLES.ROOMS, { roomId });
  if (!room) return fail(404, 'Room not found');
  if (!room.artifactPrefix) {
    return fail(400, 'Room not integrated yet. Run code collection first.');
  }

  const dir = path.join('/tmp', `demo_${roomId}_${started}`);
  try {
    await fs.mkdir(dir, { recursive: true });
    const files = await downloadProject(room.artifactPrefix, dir);
    if (files.length === 0) {
      return fail(409, 'The integrated project is empty. Run code collection again.');
    }

    const projectType = await detectProjectType(dir, files);
    console.log(`[DEMO] Room ${roomId}: ${files.length} files, type ${projectType}`);
    await broadcast(events.demoStarting(projectId, projectType));

    const remaining = () => TOTAL_BUDGET_MS - (Date.now() - started);
    let command;
    let result;

    if (projectType === 'static') {
      command = 'static site';
      result = { exitCode: 0, timedOut: false, runtime: 0, output: `Static site with ${files.length} file(s). There is nothing to execute.` };
    } else if (projectType === 'nodejs') {
      let pkg;
      try {
        pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
      } catch (e) {
        await broadcast(events.demoFailed(projectId, `package.json is invalid: ${e.message}`));
        return fail(422, `package.json is not valid JSON: ${e.message}`);
      }

      // Install dependencies when there are any and none were shipped.
      const needsInstall = Object.keys(pkg.dependencies || {}).length > 0 && !(await exists(path.join(dir, 'node_modules')));
      if (needsInstall) {
        const install = await run('npm', ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'],
          { cwd: dir, budgetMs: Math.min(INSTALL_BUDGET_MS, remaining()) });
        if (install.spawnError || install.timedOut || install.exitCode !== 0) {
          const why = install.spawnError ? `npm could not start (${install.spawnError})`
            : install.timedOut ? `dependency install did not finish in ${INSTALL_BUDGET_MS / 1000}s` : 'dependency install failed';
          await broadcast(events.demoFailed(projectId, why));
          return fail(422, why, { phase: 'install', output: tail(install.output) });
        }
      }

      if (pkg.scripts?.start) command = ['npm', ['start']];
      else if (pkg.scripts?.dev) command = ['npm', ['run', 'dev']];
      else if (pkg.main && await exists(path.join(dir, pkg.main))) command = ['node', [pkg.main]];
      else {
        const entry = ['index.js', 'server.js', 'app.js', 'main.js'].find((f) => files.includes(f));
        if (!entry) {
          await broadcast(events.demoFailed(projectId, 'nothing to launch'));
          return fail(400, 'Cannot launch: package.json has no start/dev script or main file, and there is no index.js/server.js/app.js.', { files });
        }
        command = ['node', [entry]];
      }
      result = await run(command[0], command[1], { cwd: dir, budgetMs: Math.max(MIN_RUN_MS, remaining()) });
      command = `${command[0]} ${command[1].join(' ')}`;
    } else if (projectType === 'python') {
      const entry = files.includes('main.py') ? 'main.py' : 'app.py';
      command = `python3 ${entry}`;
      result = await run('python3', [entry], { cwd: dir, budgetMs: Math.max(MIN_RUN_MS, remaining()) });
    } else if (projectType === 'unknown') {
      await broadcast(events.demoFailed(projectId, 'unknown project type'));
      return fail(400, 'Could not detect the project type (expected package.json, main.py/app.py or index.html).', { files });
    } else {
      await broadcast(events.demoFailed(projectId, `${projectType} is not supported`));
      return fail(400, `${projectType} projects cannot run in the demo sandbox. Only Node.js and Python are available.`, { projectType });
    }

    if (result.spawnError) {
      await broadcast(events.demoFailed(projectId, `${command} could not start (${result.spawnError})`));
      return fail(400, `\`${command}\` could not start in the demo sandbox (${result.spawnError}). That runtime is not installed.`, { projectType });
    }

    const success = result.exitCode === 0 || result.timedOut;
    const output = tail(result.output);

    await db.updateItem(TABLES.ROOMS, { roomId }, {
      status: 'demo_executed',
      demoResult: {
        projectType, command, exitCode: result.exitCode, runtime: result.runtime,
        success, timedOut: result.timedOut, outputSize: result.output.length, outputTail: output,
      },
      demoExecutedAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    });

    console.log(`[DEMO] ${command}: exit ${result.exitCode}, ${result.runtime}ms, timedOut=${result.timedOut}`);
    await broadcast(success
      ? events.demoCompleted(projectId, projectType, result.runtime, result.exitCode ?? 0)
      : events.demoFailed(projectId, `${command} exited with code ${result.exitCode}`));

    return {
      statusCode: 200,
      body: JSON.stringify({
        roomId,
        projectType,
        command,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        runtime: result.runtime,
        success,
        outputLength: result.output.length,
        output,
        message: result.timedOut
          ? `Started ${projectType} project and it was still running after ${Math.round(result.runtime / 1000)}s, so it was stopped`
          : success ? `Ran ${projectType} project in ${result.runtime}ms` : `${projectType} project exited with code ${result.exitCode}`,
      }),
    };
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export const demoExecuteHandler = withCors(demoExecuteHandlerImpl);
export default demoExecuteHandler;
