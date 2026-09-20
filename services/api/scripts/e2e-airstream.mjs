#!/usr/bin/env node
// End-to-end check of the Airstream pipeline against the DEPLOYED backend:
//   seed tasks -> create room -> join -> distribute -> devices submit files -> collect -> demo
// plus input validation, error cases and live WebSocket events. Cleans up everything it creates.
//
//   AWS_PROFILE=crewdesk node services/api/scripts/e2e-airstream.mjs
//   ... --extended   also runs slow scenarios: long-running server, npm install, Python, env isolation
//   ... --worker     also runs the real device worker (mock executor) through plan -> run -> collect -> demo
//   ... --worker --executor=claude   same, with the Claude CLI as the model (slow, costs a few cents)
//
// Env: API_URL, WS_URL (default: the crewdesk dev stack), AWS_REGION (default us-west-2).
// AWS credentials are needed only to seed tasks (there is no "create task" endpoint that skips
// the Bedrock lead agent) and to clean up.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { spawn } from 'node:child_process';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'us-west-2';
const API = (process.env.API_URL || 'https://hdnq75ygs3.execute-api.us-west-2.amazonaws.com/Prod').replace(/\/+$/, '');
const WS = process.env.WS_URL || 'wss://34gffaaf1a.execute-api.us-west-2.amazonaws.com/dev';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const s3 = new S3Client({ region: REGION });

const RUN = Date.now();
const PROJECT = `proj_e2e_${RUN}`;
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method, headers: { 'Content-Type': 'application/json', Origin: 'https://e2e.test' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, cors: res.headers.get('access-control-allow-origin'), text };
}

// The stack names its bucket crewdesk-artifactsbucket-<random>. Override with ARTIFACTS_BUCKET.
let bucketName = process.env.ARTIFACTS_BUCKET;
async function artifactsBucket() {
  if (!bucketName) {
    const { Buckets } = await s3.send(new ListBucketsCommand({}));
    bucketName = Buckets.find((b) => b.Name.startsWith('crewdesk-artifactsbucket-'))?.Name;
    if (!bucketName) throw new Error('artifacts bucket not found; set ARTIFACTS_BUCKET');
  }
  return bucketName;
}

// ── the "project" the devices build: three tasks, one deliberate file conflict ──
const PROJECT_FILES = {
  a: [
    { path: 'package.json', content: JSON.stringify({ name: 'e2e-demo', version: '1.0.0', scripts: { start: 'node server.js' } }) },
    { path: 'server.js', content: "const { greet } = require('./lib/greet');\nconst fs = require('fs');\nconsole.log('E2E-DEMO: ' + greet('airstream'));\nconsole.log('SHARED: ' + fs.readFileSync(__dirname + '/shared.txt', 'utf8').trim());\n" },
  ],
  b: [
    { path: 'lib/greet.js', content: "exports.greet = (n) => 'hello, ' + n;\n" },
    { path: 'shared.txt', content: 'from B\n' },
  ],
  c: [
    { path: 'shared.txt', content: 'from C\n' },             // overwrites B's file: must be reported as a conflict
    { path: 'README.md', content: '# e2e demo\n' },
  ],
};

const created = { rooms: [], devices: [], tasks: [], projects: [PROJECT] };
const EXTENDED = process.argv.includes('--extended');
const WORKER_PATH = new URL('../../../worker/device-worker.mjs', import.meta.url).pathname;
const sweep = { projects: [], roomDevices: [] }; // rows found by query at cleanup time
const events = [];
let socket;

try {
  const bucket = await artifactsBucket();

  // live events
  socket = new WebSocket(`${WS}?projectId=${PROJECT}`);
  socket.onmessage = (m) => { try { events.push(JSON.parse(m.data)); } catch { /* ignore */ } };
  await new Promise((res) => { socket.onopen = res; setTimeout(res, 8000); });
  check('websocket connects', socket.readyState === 1);

  // seed three ready tasks
  const now = Date.now();
  for (const id of ['a', 'b', 'c']) {
    const item = {
      projectId: PROJECT, sk: `TASK#e2e_${id}`, taskId: `e2e_${id}`, state: 'ready', leaseEpoch: 0, attempts: 0,
      createdAt: now + (id.charCodeAt(0) - 97), expiresAt: Math.floor(now / 1000) + 3600,
      contract: {
        objective: `E2E task ${id}`, expectedOutput: 'files', successCriteria: ['files exist'],
        allowedActions: ['write_code'], budget: { usd: 1 }, ownerAgent: 'coder', requiredTools: ['node'],
      },
    };
    await ddb.send(new PutCommand({ TableName: 'crewdesk-tasks', Item: item }));
    created.tasks.push({ projectId: PROJECT, sk: item.sk });
  }

  // room + devices
  const master = `e2e_master_${RUN}`, slave = `e2e_slave_${RUN}`;
  const room = await call('POST', `/projects/${PROJECT}/rooms`, { deviceId: master, deviceName: 'E2E Master' });
  const roomId = room.json?.roomId;
  check('create room', room.status === 200 && !!roomId && room.cors === '*', `status ${room.status}`);
  created.rooms.push(roomId); created.devices.push(master);

  const join = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/devices`, { deviceId: slave, deviceName: 'E2E Slave' });
  created.devices.push(slave);
  check('join room', join.status === 200 && Array.isArray(join.json?.capabilities?.tools), `status ${join.status}`);

  const hb = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/devices/${slave}/heartbeat`, { status: 'ok', metrics: {} });
  check('heartbeat', hb.status === 200, `status ${hb.status}`);

  // negative: collect before anything is committed, demo before collect
  const emptyCollect = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/collect`, {});
  check('collect with no committed tasks is a clean no-op', emptyCollect.status === 200 && emptyCollect.json?.filesIntegrated === 0, emptyCollect.json?.message);
  const earlyDemo = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/demo`, {});
  check('demo before collect is 400 with guidance', earlyDemo.status === 400 && /collect/i.test(earlyDemo.json?.error || ''), `status ${earlyDemo.status}`);

  // distribute
  const dist = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/distribute`, {});
  check('distribute leases all three tasks', dist.status === 200 && dist.json?.tasksDistributed === 3, JSON.stringify(dist.json));

  const listed = await call('GET', `/projects/${PROJECT}/tasks`);
  const byId = Object.fromEntries((listed.json?.tasks || []).map((t) => [t.taskId, t]));
  check('tasks list shows leased tasks with ownerAgent', ['e2e_a', 'e2e_b', 'e2e_c'].every((id) => byId[id]?.state === 'leased') && byId.e2e_a?.ownerAgent === 'coder');

  // negative: unsafe artifact paths are refused and nothing is stored
  const evil = await call('POST', `/tasks/${encodeURIComponent(`${PROJECT}#TASK#e2e_a`)}/submit`, {
    deviceId: slave, leaseEpoch: byId.e2e_a.leaseEpoch, artifacts: [{ path: '../../etc/passwd', content: 'x' }],
  });
  check('path traversal in artifacts is rejected (400)', evil.status === 400, `status ${evil.status}: ${evil.json?.error}`);
  const stale = await call('POST', `/tasks/${encodeURIComponent(`${PROJECT}#TASK#e2e_a`)}/submit`, {
    deviceId: slave, leaseEpoch: 999, artifacts: [{ path: 'x.txt', content: 'x' }],
  });
  check('stale lease epoch is rejected (409)', stale.status === 409, `status ${stale.status}`);

  // devices submit their files, in order
  for (const id of ['a', 'b', 'c']) {
    const r = await call('POST', `/tasks/${encodeURIComponent(`${PROJECT}#TASK#e2e_${id}`)}/submit`, {
      deviceId: slave, leaseEpoch: byId[`e2e_${id}`].leaseEpoch, artifacts: PROJECT_FILES[id],
    });
    check(`submit task ${id} is accepted and verified`, r.status === 200 && r.json?.passed === true, `status ${r.status} passed=${r.json?.passed}`);
  }

  // collect
  const col = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/collect`, {});
  check('collect merges 5 files from 3 tasks', col.status === 200 && col.json?.filesIntegrated === 5 && col.json?.taskCount === 3, JSON.stringify({ files: col.json?.filesIntegrated, tasks: col.json?.taskCount, msg: col.json?.message || col.json?.error }));
  check('collect reports the shared.txt conflict (C overwrote B)', col.json?.conflicts?.length === 1 && col.json.conflicts[0].path === 'shared.txt' && col.json.conflicts[0].by === 'e2e_c', JSON.stringify(col.json?.conflicts));
  check('collect verify passes', col.json?.verifyStatus === 'passed', col.json?.verifyStatus);

  const col2 = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/collect`, {});
  check('collect is idempotent', col2.status === 200 && col2.json?.filesIntegrated === 5);

  const merged = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: `rooms/${roomId}/integrated/shared.txt` }));
  check('conflict resolved last-write-wins', (await merged.Body.transformToString()).trim() === 'from C');

  // demo
  const demo = await call('POST', `/projects/${PROJECT}/rooms/${roomId}/demo`, {});
  check('demo runs the merged project', demo.status === 200 && demo.json?.success === true && demo.json?.exitCode === 0, JSON.stringify({ status: demo.status, err: demo.json?.error, exit: demo.json?.exitCode }));
  check('demo output shows code from several tasks ran together', /E2E-DEMO: hello, airstream/.test(demo.json?.output || '') && /SHARED: from C/.test(demo.json?.output || ''), JSON.stringify(demo.json?.output));

  const status = await call('GET', `/projects/${PROJECT}/rooms/${roomId}`);
  check('room status reflects the finished demo', status.json?.status === 'demo_executed' && status.json?.demoStatus?.success === true && !!status.json?.masterDir, `${status.json?.status}`);

  // ── extended scenarios (slow: real dependency installs and a server that must be stopped) ──
  if (EXTENDED) {
    // One task -> one room -> submit -> collect -> demo, in its own project.
    const scenario = async (name, files) => {
      const project = `${PROJECT}_${name}`;
      created.projects.push(project);
      const taskId = `x_${name}`;
      const item = {
        projectId: project, sk: `TASK#${taskId}`, taskId, state: 'ready', leaseEpoch: 0, attempts: 0, createdAt: Date.now(),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        contract: { objective: name, expectedOutput: 'files', successCriteria: ['ok'], allowedActions: ['write_code'], budget: { usd: 1 }, ownerAgent: 'coder', requiredTools: ['node'] },
      };
      await ddb.send(new PutCommand({ TableName: 'crewdesk-tasks', Item: item }));
      created.tasks.push({ projectId: project, sk: item.sk });
      const m = `x_master_${name}_${RUN}`, sl = `x_slave_${name}_${RUN}`;
      const rm = await call('POST', `/projects/${project}/rooms`, { deviceId: m, deviceName: 'M' });
      created.rooms.push(rm.json.roomId); created.devices.push(m, sl);
      const rid = rm.json.roomId;
      await call('POST', `/projects/${project}/rooms/${rid}/devices`, { deviceId: sl, deviceName: 'S' });
      await call('POST', `/projects/${project}/rooms/${rid}/distribute`, {});
      const t = (await call('GET', `/projects/${project}/tasks`)).json.tasks.find((x) => x.taskId === taskId);
      const sub = await call('POST', `/tasks/${encodeURIComponent(`${project}#TASK#${taskId}`)}/submit`, { deviceId: sl, leaseEpoch: t.leaseEpoch, artifacts: files });
      const col = await call('POST', `/projects/${project}/rooms/${rid}/collect`, {});
      const t0 = Date.now();
      const demo = await call('POST', `/projects/${project}/rooms/${rid}/demo`, {});
      return { sub, col, demo, elapsed: Date.now() - t0 };
    };

    const server = await scenario('server', [
      { path: 'package.json', content: JSON.stringify({ name: 's', scripts: { start: 'node server.js' } }) },
      { path: 'server.js', content: "require('http').createServer((q, r) => r.end('ok')).listen(process.env.PORT || 3000, () => console.log('LISTENING on ' + (process.env.PORT || 3000)));\n" },
    ]);
    check('long-running server: started, stopped at the budget, reported as success', server.demo.status === 200 && server.demo.json?.success === true && server.demo.json?.timedOut === true && /LISTENING/.test(server.demo.json?.output || ''), JSON.stringify({ status: server.demo.status, timedOut: server.demo.json?.timedOut, err: server.demo.json?.error }));
    check('long-running server: answered inside the 29s API Gateway limit', server.demo.status === 200 && server.elapsed < 28000, `${server.elapsed}ms`);

    const deps = await scenario('deps', [
      { path: 'package.json', content: JSON.stringify({ name: 'd', dependencies: { 'is-odd': '3.0.1' }, scripts: { start: 'node index.js' } }) },
      { path: 'index.js', content: "console.log('ODD:', require('is-odd')(3));\n" },
    ]);
    check('dependencies are installed before running', deps.demo.status === 200 && /ODD: true/.test(deps.demo.json?.output || ''), JSON.stringify({ status: deps.demo.status, err: deps.demo.json?.error, out: (deps.demo.json?.output || '').slice(-200) }));

    const py = await scenario('py', [{ path: 'main.py', content: "print('PY-OK')\n" }]);
    console.log(`INFO  python demo: status ${py.demo.status} ${py.demo.json?.error || (py.demo.json?.output || '').trim()}`);
    check('python project either runs or fails with a clear "runtime not installed" message', (py.demo.status === 200 && /PY-OK/.test(py.demo.json?.output || '')) || (py.demo.status === 400 && /could not start/.test(py.demo.json?.error || '')));

    const iso = await scenario('iso', [
      { path: 'package.json', content: JSON.stringify({ name: 'i', scripts: { start: 'node i.js' } }) },
      { path: 'i.js', content: "const keys = Object.keys(process.env).filter((k) => /^AWS_|SESSION|SECRET|TOKEN/i.test(k));\nconsole.log('LEAKED-ENV:' + JSON.stringify(keys));\n" },
    ]);
    check('demo process cannot see the Lambda AWS credentials', iso.demo.status === 200 && /LEAKED-ENV:\[\]/.test(iso.demo.json?.output || ''), (iso.demo.json?.output || iso.demo.json?.error || '').trim().slice(-160));

    const bad = await scenario('bad', [{ path: 'package.json', content: '{ not json' }]);
    check('invalid package.json: collect flags it, demo refuses with 422', bad.col.json?.verifyStatus === 'failed' && bad.demo.status === 422, `verify=${bad.col.json?.verifyStatus} demo=${bad.demo.status}`);

    const lang = await scenario('go', [{ path: 'go.mod', content: 'module x\n' }, { path: 'main.go', content: 'package main\nfunc main(){}\n' }]);
    check('unsupported runtime (Go) is a clear 400', lang.demo.status === 400 && /cannot run/.test(lang.demo.json?.error || ''), lang.demo.json?.error);
  }

  // ── device worker: plan -> a real worker process does the tasks -> collect -> demo ──
  if (process.argv.includes('--worker')) {
    const executor = (process.argv.find((a) => a.startsWith('--executor=')) || '--executor=mock').split('=')[1];
    const WP = `${PROJECT}_worker`;
    created.projects.push(WP); sweep.projects.push(WP);
    const worker = (args) => new Promise((resolve) => {
      let out = '';
      const c = spawn('node', [WORKER_PATH, ...args, '--project', WP, '--api', API], { env: process.env });
      c.stdout.on('data', (d) => { out += d; process.stdout.write(`      | ${d}`.replace(/\n(?!$)/g, '\n      | ')); });
      c.stderr.on('data', (d) => { out += d; });
      c.on('close', (code) => resolve({ code, out }));
    });
    const wcall = (m, path, body) => call(m, `/projects/${WP}${path}`, body);
    const waitFor = async (fn, ms, every = 1500) => { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, every)); } return null; };

    const wevents = [];
    const ws2 = new WebSocket(`${WS}?projectId=${WP}`);
    ws2.onmessage = (m) => { try { wevents.push(JSON.parse(m.data)); } catch { /* ignore */ } };
    await new Promise((res) => { ws2.onopen = res; setTimeout(res, 8000); });

    const wm = `w_master_${RUN}`;
    const wr = await wcall('POST', '/rooms', { deviceId: wm, deviceName: 'Worker Master' });
    const wroom = wr.json.roomId; created.rooms.push(wroom); created.devices.push(wm); sweep.roomDevices.push(wroom);

    // plan validation
    const okTask = (files) => ({ objective: 'o', expectedOutput: 'e', successCriteria: ['c'], files });
    const p400 = async (label, body) => { const r = await wcall('POST', `/rooms/${wroom}/plan`, body); check(`plan rejects ${label} (400)`, r.status === 400, `status ${r.status}: ${r.json?.error}`); };
    await p400('an empty task list', { outcome: 'x', tasks: [] });
    await p400('a missing outcome', { tasks: [okTask(['a.js'])] });
    await p400('a file owned by two tasks', { outcome: 'x', tasks: [okTask(['a.js']), okTask(['a.js'])] });
    await p400('a path that escapes the project', { outcome: 'x', tasks: [okTask(['../evil.js'])] });
    await p400('a task with no success criteria', { outcome: 'x', tasks: [{ objective: 'o', expectedOutput: 'e', successCriteria: [] }] });
    const p404 = await wcall('POST', `/rooms/room_nope/plan`, { outcome: 'x', tasks: [okTask(['a.js'])] });
    check('plan on a missing room is 404', p404.status === 404, `status ${p404.status}`);

    // re-planning supersedes the earlier plan: only the latest plan's tasks count
    const first = await wcall('POST', `/rooms/${wroom}/plan`, { outcome: 'first idea', tasks: [okTask(['old1.js']), okTask(['old2.js'])] });
    check('first plan is accepted', first.status === 200 && first.json?.tasks?.length === 2, `status ${first.status}`);
    const outcome = executor === 'mock' ? 'Build a tiny greeting project'
      : (process.env.E2E_OUTCOME || 'A Node.js command line program that prints a multiplication table for 1 to 5 under a title banner. Split it into a table generator module, a text formatter module, and the entry point.');
    const planned = await worker(['plan', outcome, '--room', wroom, '--executor', executor]);
    check('worker "plan" creates tasks', planned.code === 0 && /plan_/.test(planned.out), `exit ${planned.code}`);
    const st0 = await wcall('GET', `/rooms/${wroom}`);
    const planTotal = st0.json?.taskStats?.total;
    const newCount = parseInt((planned.out.match(/Planned (\d+) task/) || [])[1], 10);
    check('re-plan supersedes the old plan (old 2 tasks are ignored)', newCount >= 2 && planTotal === newCount && st0.json?.taskStats?.ready === newCount, `new plan ${newCount}, room counts ${planTotal}`);

    // a real worker joins and waits for work
    const wproc = worker(['run', '--room', wroom, '--executor', executor, '--max-tasks', String(planTotal), '--idle-exit', executor === 'mock' ? '25' : '300', '--name', 'e2e-worker']);
    const joined = await waitFor(async () => {
      const st = await wcall('GET', `/rooms/${wroom}`);
      return st.json?.deviceStats?.devices?.find((d) => d.name === 'e2e-worker');
    }, 40000);
    check('worker joins and reports its own capabilities', !!joined && joined.capabilities?.reportedByDevice === true && joined.capabilities.tools.includes('node'), JSON.stringify(joined?.capabilities?.tools));

    // the master distributes; the worker picks its tasks up
    const wd = await wcall('POST', `/rooms/${wroom}/distribute`, {});
    check('distribute leases the planned tasks to the worker', wd.status === 200 && wd.json?.tasksDistributed === planTotal, JSON.stringify(wd.json));

    const wres = await Promise.race([wproc, new Promise((r) => setTimeout(() => r({ code: 'timeout', out: '' }), executor === 'mock' ? 120000 : 900000))]);
    const wst = await wcall('GET', `/rooms/${wroom}`);
    check('worker finished every task and all are committed', wst.json?.taskStats?.committed === planTotal && wst.json?.taskStats?.total === planTotal, JSON.stringify(wst.json?.taskStats) + ` worker exit ${wres.code}`);

    const wcol = await wcall('POST', `/rooms/${wroom}/collect`, {});
    check('collect merges the worker\'s files', wcol.status === 200 && wcol.json?.filesIntegrated >= 3 && wcol.json?.verifyStatus === 'passed', JSON.stringify({ files: wcol.json?.filesIntegrated, verify: wcol.json?.verifyStatus, conflicts: wcol.json?.conflicts, err: wcol.json?.error }));
    const wdemo = await wcall('POST', `/rooms/${wroom}/demo`, {});
    console.log(`      | demo output: ${JSON.stringify((wdemo.json?.output || wdemo.json?.error || '').trim())}`);
    check('demo runs the project the worker built', wdemo.status === 200 && wdemo.json?.success === true, JSON.stringify({ status: wdemo.status, exit: wdemo.json?.exitCode, err: wdemo.json?.error }));
    if (executor === 'mock') check('demo output is the mock project\'s', /MOCK-PROJECT: HELLO, AIRSTREAM/.test(wdemo.json?.output || ''));

    await new Promise((r) => setTimeout(r, 2000));
    const wtypes = new Set(wevents.map((e) => e.type));
    for (const t of ['plan.created', 'device.joined', 'tasks.distributed', 'code.collected', 'demo.completed']) check(`worker run: live event ${t}`, wtypes.has(t));
    try { ws2.close(); } catch { /* ignore */ }
  }

  // events (give the last broadcasts a moment)
  await new Promise((r) => setTimeout(r, 2500));
  const types = new Set(events.map((e) => e.type));
  for (const t of ['device.joined', 'task.assigned', 'tasks.distributed', 'code.collected', 'demo.completed']) {
    check(`live event received: ${t}`, types.has(t));
  }
  console.log(`      (${events.length} events: ${[...types].join(', ')})`);
} catch (e) {
  console.log(`FAIL  unexpected error: ${e.stack || e}`);
  failures++;
} finally {
  try { socket?.close(); } catch { /* ignore */ }
  // cleanup: rows, then S3
  try {
    for (const p of sweep.projects) {
      const { Items } = await ddb.send(new QueryCommand({ TableName: 'crewdesk-tasks', KeyConditionExpression: 'projectId = :p', ExpressionAttributeValues: { ':p': p } }));
      for (const it of Items || []) await ddb.send(new DeleteCommand({ TableName: 'crewdesk-tasks', Key: { projectId: it.projectId, sk: it.sk } }));
    }
    for (const r of sweep.roomDevices) {
      const { Items } = await ddb.send(new QueryCommand({ TableName: 'crewdesk-devices', IndexName: 'RoomIndex', KeyConditionExpression: 'roomId = :r', ExpressionAttributeValues: { ':r': r } }));
      for (const it of Items || []) await ddb.send(new DeleteCommand({ TableName: 'crewdesk-devices', Key: { deviceId: it.deviceId } }));
    }
    for (const k of created.tasks) await ddb.send(new DeleteCommand({ TableName: 'crewdesk-tasks', Key: k }));
    for (const id of created.devices) await ddb.send(new DeleteCommand({ TableName: 'crewdesk-devices', Key: { deviceId: id } }));
    for (const id of created.rooms.filter(Boolean)) await ddb.send(new DeleteCommand({ TableName: 'crewdesk-rooms', Key: { roomId: id } }));
    const bucket = await artifactsBucket();
    for (const prefix of [...created.projects.map((p) => `projects/${p}/`), ...created.rooms.filter(Boolean).map((r) => `rooms/${r}/`)]) {
      const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
      if (list.Contents?.length) {
        await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: list.Contents.map((o) => ({ Key: o.Key })), Quiet: true } }));
      }
    }
    console.log('cleaned up test rows and files');
  } catch (e) {
    console.log(`WARN  cleanup incomplete: ${e.message}  (project ${PROJECT})`);
  }
}

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`);
process.exit(failures ? 1 : 0);
