#!/usr/bin/env node
// Airstream device worker.
//
// Runs on a real machine. It joins a room, keeps itself alive with heartbeats, picks up the
// tasks the room leased to it, does the work with this machine's own agent CLI, and submits the
// files it produced. The master then collects and runs them.
//
//   node worker/device-worker.mjs create-room [--name "My laptop"]
//   node worker/device-worker.mjs plan "a CLI that prints a FizzBuzz table" --room <id>
//   node worker/device-worker.mjs run --room <id>                 (on every device, incl. this one)
//   node worker/device-worker.mjs distribute|collect|demo|status --room <id>
//
// Options (or env):  --api / AIRSTREAM_API_URL   --project / AIRSTREAM_PROJECT (default proj_demo)
//   --executor claude|mock (AIRSTREAM_EXECUTOR)  --model <alias>  --name <device name>
//   --max-tasks N   stop after N finished tasks    --idle-exit S   stop after S seconds without work
//   --max-usd X     spend cap per model call (default 1)          --keep-workdir   keep scratch folders
//
// Zero dependencies; needs Node 22+. The `claude` executor needs the Claude Code CLI on this machine.

import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';

const DEFAULT_API = 'https://hdnq75ygs3.execute-api.us-west-2.amazonaws.com/Prod';
const HEARTBEAT_MS = 8_000;
const POLL_MS = 3_000;
const CLAUDE_TASK_TIMEOUT_MS = 240_000;   // leases last 5 minutes
const CLAUDE_PLAN_TIMEOUT_MS = 120_000;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES = 200;

// ── small helpers ────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toLocaleTimeString([], { hour12: false });
const log = (...a) => console.log(`[${stamp()}]`, ...a);
const fail = (msg, code = 1) => { console.error(`error: ${msg}`); process.exit(code); };

function parseArgs(argv) {
  const BOOL = new Set(['keep-workdir', 'help']);
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { positional.push(a); continue; }
    const [k, inline] = a.slice(2).split(/=(.*)/s, 2);
    if (BOOL.has(k)) flags[k] = true;
    else flags[k] = inline !== undefined ? inline : argv[++i];
  }
  return { positional, flags };
}

// ── talking to the backend ───────────────────────────────────────────────────

function makeApi({ base, project }) {
  const b = base.replace(/\/+$/, '');
  async function call(method, route, body, { retries = 2 } = {}) {
    for (let attempt = 0; ; attempt++) {
      let res;
      try {
        res = await fetch(`${b}${route}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch (e) {
        if (attempt < retries) { await sleep(1000 * (attempt + 1)); continue; }
        throw Object.assign(new Error(`backend unreachable: ${e.message}`), { status: 0 });
      }
      const text = await res.text();
      let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
      if (res.status >= 502 && res.status <= 504 && attempt < retries) { await sleep(1000 * (attempt + 1)); continue; }
      if (!res.ok) throw Object.assign(new Error(json?.error || `${res.status} ${text.slice(0, 200)}`), { status: res.status, body: json });
      return json;
    }
  }
  const room = (r) => `/projects/${encodeURIComponent(project)}/rooms/${encodeURIComponent(r)}`;
  return {
    createRoom: (deviceId, deviceName) => call('POST', `/projects/${encodeURIComponent(project)}/rooms`, { deviceId, deviceName }),
    join: (r, deviceId, deviceName, capabilities) => call('POST', `${room(r)}/devices`, { deviceId, deviceName, capabilities }),
    heartbeat: (r, deviceId, metrics) => call('POST', `${room(r)}/devices/${encodeURIComponent(deviceId)}/heartbeat`, { status: 'ok', metrics }),
    status: (r) => call('GET', room(r)),
    tasks: () => call('GET', `/projects/${encodeURIComponent(project)}/tasks`),
    plan: (r, outcome, tasks) => call('POST', `${room(r)}/plan`, { outcome, tasks }, { retries: 0 }),
    distribute: (r) => call('POST', `${room(r)}/distribute`, {}, { retries: 0 }),
    collect: (r) => call('POST', `${room(r)}/collect`, {}, { retries: 0 }),
    demo: (r) => call('POST', `${room(r)}/demo`, {}, { retries: 0 }),
    submit: (taskId, deviceId, leaseEpoch, artifacts) =>
      call('POST', `/tasks/${encodeURIComponent(`${project}#TASK#${taskId}`)}/submit`, { deviceId, leaseEpoch, artifacts }, { retries: 1 }),
  };
}

// ── this device's capabilities ───────────────────────────────────────────────

const run = (cmd, args) => new Promise((resolve) => {
  execFile(cmd, args, { timeout: 5000 }, (err) => resolve(!err));
});

async function detectCapabilities() {
  const checks = {
    node: ['node', ['--version']], npm: ['npm', ['--version']], python: ['python3', ['--version']],
    git: ['git', ['--version']], docker: ['docker', ['--version']], go: ['go', ['version']],
    rust: ['rustc', ['--version']], claude: ['claude', ['--version']],
  };
  const found = await Promise.all(Object.entries(checks).map(async ([name, [cmd, args]]) => ((await run(cmd, args)) ? name : null)));
  const cpus = os.cpus();
  const totalGb = os.totalmem() / 2 ** 30;
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model || 'unknown',
    memTotalGb: +totalGb.toFixed(1),
    memFreeGb: +(os.freemem() / 2 ** 30).toFixed(1),
    benchScore: Math.min(10, +(cpus.length / 4 + totalGb / 8).toFixed(1)),
    tools: found.filter(Boolean),
    nodeVersion: process.version,
  };
}

// ── executors: the part that does the thinking ───────────────────────────────

/** Pull the first JSON object out of a model reply (tolerates code fences and chatter). */
function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('the model did not return JSON');
  return JSON.parse(text.slice(start, end + 1));
}

/** One headless Claude Code call. `--restricted` removes every tool that runs commands and confines
 *  file access to `cwd`, so the agent can only read and write files in its scratch folder. */
function runClaude(prompt, { cwd, model, maxUsd, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const args = ['-p', '--restricted', '--permission-mode', 'acceptEdits', '--no-session-persistence',
      '--output-format', 'json', '--max-budget-usd', String(maxUsd)];
    if (model) args.push('--model', model);

    const child = spawn('claude', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`claude timed out after ${Math.round(timeoutMs / 1000)}s`)); }, timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(new Error(e.code === 'ENOENT' ? 'the `claude` CLI is not installed on this machine' : e.message)); });
    child.on('close', () => {
      clearTimeout(timer);
      let parsed;
      try { parsed = JSON.parse(out); } catch { return reject(new Error(`claude gave no JSON: ${(err || out).slice(0, 300)}`)); }
      if (parsed.is_error) return reject(new Error(`claude reported an error: ${String(parsed.result || parsed.subtype || '').slice(0, 300)}`));
      resolve({ text: String(parsed.result ?? ''), cost: parsed.total_cost_usd ?? 0 });
    });
    child.stdin.end(prompt);
  });
}

const claudeExecutor = {
  async plan({ outcome, count, model, maxUsd, feedback }) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'airstream-plan-'));
    try {
      const prompt = `You are the technical lead for a small software project that several engineers will build IN PARALLEL on different machines. Nobody can see anyone else's work, so split the project so each task owns its own files and the tasks fit together through interfaces you define now.

PROJECT OUTCOME:
${outcome}

Split it into exactly ${count} tasks. Rules:
- Node.js, CommonJS ("require"), no npm dependencies. The finished project must start with \`npm start\` and finish by itself within 10 seconds (print its results, exit code 0) so it can be demoed automatically.
- EVERY task lists the files it owns in "files" (relative paths, never empty), and no file appears in two tasks. Exactly one task owns package.json (with a "start" script) and the entry point.
- In "notes" write the exact interface other tasks rely on: module paths, exported function names with signatures, data shapes. Where two tasks meet, both must state the same interface.
- Each task must be doable on its own from its notes in a few minutes.

${feedback ? `Your previous plan was rejected: ${feedback}\nFix exactly that.\n\n` : ''}Do not use any tools. Reply with ONLY JSON, no prose and no code fences:
{"tasks":[{"objective":"one sentence","expectedOutput":"what exists when it is done","successCriteria":["testable statement"],"files":["relative/path.js"],"notes":"interfaces"}]}`;
      const { text, cost } = await runClaude(prompt, { cwd: dir, model, maxUsd, timeoutMs: CLAUDE_PLAN_TIMEOUT_MS });
      return { tasks: extractJson(text).tasks, cost };
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  },

  async execute({ task, plan, outcome, workdir, model, maxUsd, timeoutMs, feedback }) {
    const c = task.contract;
    const others = plan.filter((t) => t.taskId !== task.taskId)
      .map((t) => `- ${t.contract.objective}\n  owns: ${(t.contract.files || []).join(', ') || '(unspecified)'}\n  ${t.contract.notes ? `notes: ${t.contract.notes.replace(/\n/g, '\n  ')}` : ''}`).join('\n');
    const prompt = `You are one of several engineers building a project IN PARALLEL on different machines. Your working folder is empty and you can only see it. The other engineers build the other tasks; their files will be merged with yours afterwards, so stick to the agreed interfaces exactly.

PROJECT OUTCOME:
${outcome}

THE OTHER TASKS (do not write their files):
${others || '(none)'}

YOUR TASK:
Objective: ${c.objective}
Expected output: ${c.expectedOutput}
Success criteria:
${c.successCriteria.map((s) => `- ${s}`).join('\n')}
${c.files?.length ? `Files you must create, at exactly these paths:\n${c.files.map((f) => `- ${f}`).join('\n')}\n` : ''}${c.notes ? `Interfaces and conventions to follow:\n${c.notes}\n` : ''}
Rules:
- Create only the files listed for your task${c.files?.length ? '' : ' (plus what your objective needs)'}. Use CommonJS and no npm dependencies unless the notes say otherwise.
- Keep it small, correct and complete. Do not leave TODOs.
${feedback ? `\nYOUR PREVIOUS ATTEMPT WAS REJECTED: ${feedback}\nFix exactly that.\n` : ''}
When every file is written, reply with the single word DONE.`;
    const { cost } = await runClaude(prompt, { cwd: workdir, model, maxUsd, timeoutMs });
    return { cost };
  },
};

// Deterministic stand-in for a model: same tasks and same files every time. For testing the
// pipeline end to end without spending tokens.
const MOCK_FILES = {
  'package.json': JSON.stringify({ name: 'mock-project', version: '1.0.0', scripts: { start: 'node index.js' } }, null, 2) + '\n',
  'index.js': "const { greet } = require('./lib/greet');\nconst { shout } = require('./lib/format');\nconsole.log('MOCK-PROJECT: ' + shout(greet('airstream')));\n",
  'lib/greet.js': "exports.greet = (name) => 'hello, ' + name;\n",
  'lib/format.js': "exports.shout = (s) => s.toUpperCase();\n",
  'README.md': '# Mock project\n\nBuilt by three devices in parallel.\n',
};
const mockExecutor = {
  async plan() {
    const mk = (objective, files) => ({
      objective, expectedOutput: `${files.join(', ')} exist and work`, successCriteria: ['files exist', 'code runs'], files,
      notes: 'index.js requires ./lib/greet (greet(name)) and ./lib/format (shout(text)).',
    });
    return { tasks: [mk('Entry point and package.json', ['package.json', 'index.js']), mk('Greeting module', ['lib/greet.js']), mk('Formatting module and README', ['lib/format.js', 'README.md'])], cost: 0 };
  },
  async execute({ task, workdir }) {
    await sleep(parseInt(process.env.AIRSTREAM_MOCK_DELAY_MS || '300', 10) || 300); // slow it down to watch a task being built
    for (const rel of task.contract.files || []) {
      if (!(rel in MOCK_FILES)) throw new Error(`mock executor has no content for ${rel}`);
      await fs.mkdir(path.dirname(path.join(workdir, rel)), { recursive: true });
      await fs.writeFile(path.join(workdir, rel), MOCK_FILES[rel]);
    }
    return { cost: 0 };
  },
};

const EXECUTORS = { claude: claudeExecutor, mock: mockExecutor };

// ── turning a scratch folder into artifacts ──────────────────────────────────

const SKIP_DIRS = new Set(['node_modules', '.git', '.claude']);

async function collectFiles(root, allowed) {
  const found = [];
  async function walk(dir) {
    for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) await walk(abs); continue; }
      if (!ent.isFile()) continue;
      found.push(path.relative(root, abs).split(path.sep).join('/'));
    }
  }
  await walk(root);

  const dropped = allowed ? found.filter((f) => !allowed.includes(f)) : [];
  const keep = allowed ? found.filter((f) => allowed.includes(f)) : found;
  const missing = allowed ? allowed.filter((f) => !found.includes(f)) : [];
  if (keep.length > MAX_FILES) throw new Error(`too many files (${keep.length} > ${MAX_FILES})`);

  const artifacts = [];
  for (const rel of keep) {
    const buf = await fs.readFile(path.join(root, rel));
    if (buf.length > MAX_FILE_BYTES) throw new Error(`${rel} is larger than ${MAX_FILE_BYTES} bytes`);
    const binary = buf.includes(0);
    artifacts.push({ path: rel, content: buf.toString(binary ? 'base64' : 'utf8'), ...(binary ? { encoding: 'base64' } : {}) });
  }
  return { artifacts, dropped, missing };
}

// ── commands ─────────────────────────────────────────────────────────────────

async function cmdRun(cfg, api) {
  const executor = EXECUTORS[cfg.executor];
  const deviceId = `worker_${os.hostname().replace(/[^A-Za-z0-9]/g, '').slice(0, 12)}_${crypto.randomBytes(3).toString('hex')}`;
  const caps = await detectCapabilities();
  const joined = await api.join(cfg.room, deviceId, cfg.name, caps);
  log(`joined room ${cfg.room} as "${cfg.name}" (${deviceId}); tools: ${joined.capabilities.tools.join(', ') || 'none'}; executor: ${cfg.executor}`);

  // What this device is doing right now. Reported in every heartbeat so the room can tell "assigned"
  // (leased to me, waiting its turn) from "building" (I am on it).
  const state = { activeTaskId: null };
  const beat = async () => {
    const cores = os.cpus().length || 1;
    const metrics = {
      cpuUsage: Math.min(100, (os.loadavg()[0] / cores) * 100),
      memUsage: (1 - os.freemem() / os.totalmem()) * 100,
      activeTaskCount: state.activeTaskId ? 1 : 0,
      ...(state.activeTaskId ? { activeTaskId: state.activeTaskId } : {}),
    };
    try { await api.heartbeat(cfg.room, deviceId, metrics); hbFailing = false; }
    catch (e) { if (!hbFailing) log(`heartbeat failed: ${e.message}`); hbFailing = true; }
  };
  let hbFailing = false;
  const hb = setInterval(beat, HEARTBEAT_MS);
  void beat(); // so the room knows straight away, not 8 seconds from now

  let stopping = false;
  process.on('SIGINT', () => { if (stopping) process.exit(130); stopping = true; log('stopping after the current task (Ctrl-C again to force)…'); });

  const handled = new Set(); // taskId:leaseEpoch already attempted, so a failing task is not retried in a loop
  let finished = 0;
  let idleSince = Date.now();
  log('waiting for tasks — the master needs to run "distribute"');

  while (!stopping) {
    let list;
    try { list = await api.tasks(); } catch (e) { log(`could not list tasks: ${e.message}`); await sleep(POLL_MS); continue; }

    const inRoom = list.tasks.filter((t) => !t.roomId || t.roomId === cfg.room).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // plan order
    const mine = inRoom.find((t) => t.state === 'leased' && t.leaseOwner === deviceId && !handled.has(`${t.taskId}:${t.leaseEpoch}`));

    if (!mine) {
      if (cfg.idleExit && Date.now() - idleSince > cfg.idleExit * 1000) { log('idle, exiting'); break; }
      await sleep(POLL_MS);
      continue;
    }

    handled.add(`${mine.taskId}:${mine.leaseEpoch}`);
    idleSince = Date.now();
    const plan = inRoom.filter((t) => t.planId === mine.planId && t.contract).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    state.activeTaskId = mine.taskId;
    void beat(); // say which task I am on now, not at the next heartbeat
    try {
      if (await doTask({ cfg, api, executor, deviceId, task: mine, plan, outcome: list.outcome || '' })) finished++;
    } finally {
      state.activeTaskId = null;
    }
    idleSince = Date.now();
    if (cfg.maxTasks && finished >= cfg.maxTasks) { log(`finished ${finished} task(s), exiting`); break; }
  }

  clearInterval(hb);
  return finished;
}

async function doTask({ cfg, api, executor, deviceId, task, plan, outcome }) {
  const started = Date.now();
  const c = task.contract;
  if (!c) { log(`task ${task.taskId} has no contract, skipping`); return false; }
  log(`▶ ${task.taskId}: ${c.objective}`);

  const leaseLeft = (task.leaseExpiry || Date.now() + CLAUDE_TASK_TIMEOUT_MS) - Date.now();
  const timeoutMs = Math.min(CLAUDE_TASK_TIMEOUT_MS, leaseLeft - 20_000);
  if (timeoutMs < 20_000) { log(`  lease has only ${Math.round(leaseLeft / 1000)}s left, skipping`); return false; }

  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), `airstream-${task.taskId}-`));
  try {
    let artifacts, feedback;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { cost } = await executor.execute({ task, plan, outcome, workdir, model: cfg.model, maxUsd: cfg.maxUsd, timeoutMs, feedback });
      const got = await collectFiles(workdir, c.files);
      if (got.dropped.length) log(`  ignoring files that belong to other tasks: ${got.dropped.join(', ')}`);
      if (got.missing.length === 0 && got.artifacts.length > 0) { artifacts = got.artifacts; if (cost) log(`  model cost $${cost.toFixed(3)}`); break; }
      feedback = got.artifacts.length === 0 ? 'no files were written' : `these required files are missing: ${got.missing.join(', ')}`;
      log(`  attempt ${attempt}: ${feedback}`);
    }
    if (!artifacts) { log(`✗ ${task.taskId}: giving up (not submitted; the lease will expire and the task can be reassigned)`); return false; }

    const res = await api.submit(task.taskId, deviceId, task.leaseEpoch, artifacts);
    const took = Math.round((Date.now() - started) / 1000);
    if (res.passed) { log(`✓ ${task.taskId}: submitted ${artifacts.length} file(s) in ${took}s — verified`); return true; }
    log(`✗ ${task.taskId}: submitted but not verified: ${JSON.stringify(res.verifyResult?.criteria?.filter((k) => !k.passed).map((k) => k.name))}`);
    return false;
  } catch (e) {
    log(`✗ ${task.taskId}: ${e.status === 409 ? 'lease was reassigned to another device (stale submission)' : e.message}`);
    return false;
  } finally {
    if (!cfg.keepWorkdir) await fs.rm(workdir, { recursive: true, force: true }).catch(() => {});
    else log(`  workdir kept: ${workdir}`);
  }
}

async function cmdPlan(cfg, api, outcome) {
  if (!outcome) fail('plan needs the outcome, e.g.: plan "a CLI that prints a FizzBuzz table" --room <id>');
  const count = Math.min(6, Math.max(2, parseInt(cfg.tasks || '3', 10) || 3));
  const executor = EXECUTORS[cfg.executor];
  log(`planning ${count} tasks with the ${cfg.executor} executor…`);

  let feedback;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { tasks, cost } = await executor.plan({ outcome, count, model: cfg.model, maxUsd: cfg.maxUsd, feedback });
    if (cost) log(`model cost $${cost.toFixed(3)}`);

    // Every task must own files, or two devices can silently write the same path.
    const noFiles = Array.isArray(tasks) ? tasks.filter((t) => !Array.isArray(t.files) || t.files.length === 0) : [];
    if (!Array.isArray(tasks) || noFiles.length) {
      feedback = !Array.isArray(tasks) ? 'the reply had no "tasks" array' : `these tasks list no files: ${noFiles.map((t) => `"${t.objective}"`).join('; ')}`;
      log(`  attempt ${attempt}: ${feedback}`);
      continue;
    }
    try {
      const res = await api.plan(cfg.room, outcome, tasks);
      log(`plan ${res.planId}: ${res.message}`);
      for (const t of res.tasks) log(`  • ${t.taskId}  ${t.objective}${t.files.length ? `  [${t.files.join(', ')}]` : ''}`);
      return;
    } catch (e) {
      if (e.status !== 400) throw e; // only a rejected plan is worth another try
      feedback = e.message;
      log(`  attempt ${attempt}: the backend rejected the plan: ${feedback}`);
    }
  }
  fail(`could not produce an acceptable plan: ${feedback}`);
}

async function cmdStatus(cfg, api) {
  const [room, list] = await Promise.all([api.status(cfg.room), api.tasks()]);
  console.log(`room ${room.roomId}: ${room.status}  devices ${room.deviceStats.online}/${room.deviceStats.total}  tasks ${room.taskStats.committed}/${room.taskStats.total} done`);
  for (const d of room.deviceStats.devices) console.log(`  device ${d.status === 'online' ? '●' : '○'} ${d.name}${d.isMaster ? ' (master)' : ''}  ${d.capabilities?.tools?.join(',') || ''}`);
  for (const t of list.tasks.filter((x) => !x.roomId || x.roomId === cfg.room)) console.log(`  task ${t.state.padEnd(9)} ${t.taskId}  ${t.objective || ''}  ${t.leaseOwner || t.resultDeviceId || ''}`);
}

// ── main ─────────────────────────────────────────────────────────────────────

const HELP = fsHelp();
function fsHelp() {
  return `Airstream device worker

  create-room [--name N]            create a room; this machine becomes its master device
  plan "<outcome>" --room R         have the model split an outcome into tasks (master, once)
  run --room R                      join as a worker and do the tasks leased to this machine
  distribute|collect|demo --room R  master actions (same as the buttons on /airstream)
  status --room R                   room, devices and tasks

Options: --api URL  --project ID  --executor claude|mock  --model ALIAS  --name N
         --max-tasks N  --idle-exit SECONDS  --max-usd X  --tasks N  --keep-workdir
Env:     AIRSTREAM_API_URL  AIRSTREAM_PROJECT  AIRSTREAM_ROOM  AIRSTREAM_EXECUTOR`;
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, ...rest] = positional;
  if (!command || flags.help || command === 'help') { console.log(HELP); return; }

  const cfg = {
    room: flags.room || process.env.AIRSTREAM_ROOM,
    project: flags.project || process.env.AIRSTREAM_PROJECT || 'proj_demo',
    executor: flags.executor || process.env.AIRSTREAM_EXECUTOR || 'claude',
    model: flags.model || process.env.AIRSTREAM_MODEL,
    name: flags.name || os.hostname(),
    maxTasks: flags['max-tasks'] ? parseInt(flags['max-tasks'], 10) : 0,
    idleExit: flags['idle-exit'] ? parseInt(flags['idle-exit'], 10) : 0,
    maxUsd: parseFloat(flags['max-usd'] || process.env.AIRSTREAM_MAX_USD || '1') || 1,
    tasks: flags.tasks,
    keepWorkdir: !!flags['keep-workdir'],
  };
  if (!EXECUTORS[cfg.executor]) fail(`unknown executor "${cfg.executor}" (use claude or mock)`);
  const api = makeApi({ base: flags.api || process.env.AIRSTREAM_API_URL || DEFAULT_API, project: cfg.project });
  const needRoom = () => { if (!cfg.room) fail('--room <roomId> is required (or set AIRSTREAM_ROOM)'); };

  switch (command) {
    case 'create-room': {
      const r = await api.createRoom(`master_${os.hostname().replace(/[^A-Za-z0-9]/g, '').slice(0, 12)}_${crypto.randomBytes(3).toString('hex')}`, cfg.name);
      console.log(r.roomId);
      log(`room created. Next: run the worker on each device with --room ${r.roomId}`);
      break;
    }
    case 'plan': needRoom(); await cmdPlan(cfg, api, rest.join(' ').trim()); break;
    case 'run': needRoom(); await cmdRun(cfg, api); break;
    case 'status': needRoom(); await cmdStatus(cfg, api); break;
    case 'distribute': { needRoom(); const r = await api.distribute(cfg.room); log(`distributed ${r.tasksDistributed} task(s), ${r.tasksFailed} unassigned`); break; }
    case 'collect': { needRoom(); const r = await api.collect(cfg.room); log(r.message + (r.conflicts?.length ? ` — conflicts: ${r.conflicts.map((c) => c.path).join(', ')}` : '') + ` (verify ${r.verifyStatus})`); break; }
    case 'demo': {
      needRoom(); const r = await api.demo(cfg.room);
      log(`${r.message} (${r.command}, exit ${r.exitCode}, ${r.runtime}ms)`);
      console.log('--- output ---\n' + (r.output || '').trim());
      break;
    }
    default: fail(`unknown command "${command}". Run with --help.`);
  }
}

main().catch((e) => fail(e.message));
