/**
 * POST /projects/{projectId}/rooms/{roomId}/collect
 *
 * Merge the files devices submitted for every COMMITTED task in the project into one
 * project at s3://{bucket}/rooms/{roomId}/integrated/, ready for the demo step.
 *
 *  - tasks are applied oldest-commit first; when two tasks wrote the same path the later one
 *    wins and the overwrite is reported as a conflict
 *  - re-running collect rebuilds the folder from scratch, so the result is always a pure
 *    function of the committed tasks (no stale files from a previous run)
 *  - nothing is written and the room is left alone when there is nothing to collect
 */

import { db } from '../../lib/dynamodb.mjs';
import { TABLES } from '../../schema.mjs';
import broadcast, { events } from '../../lib/broadcast.mjs';
import { withCors } from '../../lib/cors.mjs';
import { tasksForRoom } from '../../lib/contracts.mjs';
import {
  bucket, taskPrefix, integratedPrefix, reportKey,
  listObjects, getObject, putObject, deletePrefix, mapLimit,
} from '../../lib/artifacts.mjs';

/** Cheap structural checks on the merged project. Not a build — that would not fit the request budget. */
async function verifyIntegration(prefix, paths) {
  const notes = [];
  let status = 'passed';

  if (paths.includes('package.json')) {
    try {
      const pkg = JSON.parse((await getObject(prefix + 'package.json')).toString('utf8'));
      const runnable = pkg.scripts?.start || pkg.scripts?.dev || pkg.main;
      if (!runnable) notes.push('package.json has no start/dev script and no main entry, so demo will fall back to `npm start`');
    } catch (e) {
      status = 'failed';
      notes.push(`package.json is not valid JSON: ${e.message}`);
    }
  } else {
    notes.push('no package.json in the merged project');
  }
  return { status, notes };
}

async function codeCollectHandlerImpl(event) {
  const { projectId, roomId } = event.pathParameters;
  const now = Date.now();

  const room = await db.getItem(TABLES.ROOMS, { roomId });
  if (!room) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Room not found' }) };
  }

  const committed = tasksForRoom(await db.query(TABLES.TASKS, {
    keyConditionExpression: 'projectId = :projectId',
    filterExpression: '#state = :state',
    expressionAttributeNames: { '#state': 'state' },
    expressionAttributeValues: { ':projectId': projectId, ':state': 'committed' },
  }), room);
  committed.sort((a, b) => (a.committedAt || a.submittedAt || 0) - (b.committedAt || b.submittedAt || 0));

  const deviceIds = new Set(committed.map((t) => t.resultDeviceId).filter(Boolean));
  console.log(`[COLLECT] Room ${roomId}: ${committed.length} committed tasks from ${deviceIds.size} devices`);
  await broadcast(events.codeCollecting(projectId, deviceIds.size, committed.length));

  // Decide what ends up where. Later tasks overwrite earlier ones.
  const winners = new Map(); // relative path -> { key, taskId, deviceId }
  const conflicts = [];
  for (const task of committed) {
    const prefix = taskPrefix(projectId, task.taskId);
    for (const obj of await listObjects(prefix)) {
      const rel = obj.key.slice(prefix.length);
      if (!rel) continue;
      const prev = winners.get(rel);
      if (prev) conflicts.push({ path: rel, overwrote: prev.taskId, by: task.taskId });
      winners.set(rel, { key: obj.key, taskId: task.taskId, deviceId: task.resultDeviceId || null });
    }
  }

  if (winners.size === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        roomId,
        masterDir: null,
        filesIntegrated: 0,
        taskCount: committed.length,
        deviceCount: deviceIds.size,
        conflicts: [],
        verifyStatus: 'skipped',
        message: committed.length === 0
          ? 'No committed tasks yet, so there is nothing to collect'
          : 'Committed tasks did not submit any files, so there is nothing to collect',
      }),
    };
  }

  // Rebuild the integrated folder from scratch.
  const dest = integratedPrefix(roomId);
  await deletePrefix(dest);
  const entries = [...winners.entries()];
  await mapLimit(entries, 16, async ([rel, w]) => putObject(dest + rel, await getObject(w.key)));

  const paths = entries.map(([rel]) => rel).sort();
  const verify = await verifyIntegration(dest, paths);
  const masterDir = `s3://${bucket()}/${dest}`;

  const perDevice = {};
  for (const [, w] of entries) if (w.deviceId) perDevice[w.deviceId] = (perDevice[w.deviceId] || 0) + 1;

  await putObject(reportKey(roomId), JSON.stringify({
    roomId, projectId, collectedAt: now, tasks: committed.map((t) => t.taskId),
    files: paths, filesPerDevice: perDevice, conflicts, verify,
  }, null, 2), 'application/json');

  await db.updateItem(TABLES.ROOMS, { roomId }, {
    status: 'integrated',
    masterDir,
    artifactPrefix: dest,
    integrationTime: now,
    integratedTaskCount: committed.length,
    filesIntegrated: paths.length,
    expiresAt: now + 86400000,
  });

  console.log(`[COLLECT] Integrated ${paths.length} files (${conflicts.length} conflicts) at ${masterDir}`);
  await broadcast(events.codeCollected(projectId, paths.length));

  return {
    statusCode: 200,
    body: JSON.stringify({
      roomId,
      masterDir,
      filesIntegrated: paths.length,
      taskCount: committed.length,
      deviceCount: deviceIds.size,
      conflicts,
      verifyStatus: verify.status,
      verifyNotes: verify.notes,
      message: `Integrated ${paths.length} file(s) from ${committed.length} task(s)`,
    }),
  };
}

export const codeCollectHandler = withCors(codeCollectHandlerImpl);
export default codeCollectHandler;
