// Shared artifact storage (S3).
//
// Lambda /tmp is per-instance, so files a device submits, the files collect merges and
// the files demo runs have to live somewhere every function can reach. Layout:
//
//   projects/{projectId}/tasks/{taskId}/{path}   files a device submitted for one task
//   rooms/{roomId}/integrated/{path}             the merged project (output of collect)
//   rooms/{roomId}/integration-report.json       what collect merged, and any conflicts

import {
  S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const LIMITS = {
  maxFiles: 200,
  maxFileBytes: 1024 * 1024,        // per file
  maxTotalBytes: 4 * 1024 * 1024,   // per submission (API Gateway/Lambda payloads cap out near 6 MB)
  maxPathLength: 200,
};

/** A problem with what the caller sent (maps to HTTP 400). */
export class ArtifactError extends Error {
  constructor(message) { super(message); this.name = 'ArtifactError'; this.statusCode = 400; }
}

export function bucket() {
  const b = process.env.ARTIFACTS_BUCKET;
  if (!b) throw new Error('ARTIFACTS_BUCKET is not configured');
  return b;
}

// ids come from URL paths; keep them from shaping the key structure
const seg = (s) => String(s).replace(/[^A-Za-z0-9_.\-]/g, '_');

export const taskPrefix = (projectId, taskId) => `projects/${seg(projectId)}/tasks/${seg(taskId)}/`;
export const integratedPrefix = (roomId) => `rooms/${seg(roomId)}/integrated/`;
export const reportKey = (roomId) => `rooms/${seg(roomId)}/integration-report.json`;

/** Normalise a relative file path and refuse anything that could escape its folder. */
export function sanitizePath(input) {
  if (typeof input !== 'string' || input.length === 0) throw new ArtifactError('artifact path must be a non-empty string');
  const p = input.replace(/\\/g, '/').replace(/^(\.\/)+/, '');
  if (p.length > LIMITS.maxPathLength) throw new ArtifactError(`artifact path too long: ${p.slice(0, 40)}…`);
  if (p.startsWith('/') || /^[A-Za-z]:/.test(p)) throw new ArtifactError(`artifact path must be relative: ${p}`);
  if (/[\u0000-\u001f]/.test(p)) throw new ArtifactError('artifact path contains control characters');
  for (const part of p.split('/')) {
    if (part === '' || part === '.' || part === '..') throw new ArtifactError(`invalid artifact path: ${p}`);
  }
  return p;
}

/**
 * Validate a submission's `artifacts` array: [{ path, content, encoding? }] where encoding is
 * 'utf8' (default) or 'base64'. Returns [{ path, body: Buffer }].
 */
export function validateArtifacts(artifacts) {
  if (artifacts === undefined || artifacts === null) return [];
  if (!Array.isArray(artifacts)) throw new ArtifactError('artifacts must be an array');
  if (artifacts.length > LIMITS.maxFiles) throw new ArtifactError(`too many artifacts (max ${LIMITS.maxFiles})`);

  const seen = new Set();
  let total = 0;
  return artifacts.map((a) => {
    if (!a || typeof a !== 'object') throw new ArtifactError('each artifact must be an object');
    const path = sanitizePath(a.path);
    if (seen.has(path)) throw new ArtifactError(`duplicate artifact path: ${path}`);
    seen.add(path);
    if (typeof a.content !== 'string') throw new ArtifactError(`artifact ${path}: content must be a string`);
    const enc = a.encoding === undefined ? 'utf8' : a.encoding;
    if (enc !== 'utf8' && enc !== 'base64') throw new ArtifactError(`artifact ${path}: encoding must be utf8 or base64`);
    const body = Buffer.from(a.content, enc);
    if (body.length > LIMITS.maxFileBytes) throw new ArtifactError(`artifact ${path} exceeds ${LIMITS.maxFileBytes} bytes`);
    total += body.length;
    if (total > LIMITS.maxTotalBytes) throw new ArtifactError(`artifacts exceed ${LIMITS.maxTotalBytes} bytes in total`);
    return { path, body };
  });
}

// ── S3 helpers ───────────────────────────────────────────────────────────────

/** Run `fn` over `items` with a bounded number in flight. */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function putObject(key, body, contentType = 'application/octet-stream') {
  await s3.send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

export async function putFiles(prefix, files) {
  await mapLimit(files, 16, (f) => putObject(prefix + f.path, f.body));
}

export async function getObject(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return Buffer.from(await res.Body.transformToByteArray());
}

/** Every object under a prefix (follows pagination): [{ key, size }]. */
export async function listObjects(prefix) {
  const out = [];
  let ContinuationToken;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken }));
    for (const o of res.Contents || []) out.push({ key: o.Key, size: o.Size });
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return out;
}

export async function deletePrefix(prefix) {
  const objs = await listObjects(prefix);
  for (let i = 0; i < objs.length; i += 1000) {
    await s3.send(new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: objs.slice(i, i + 1000).map((o) => ({ Key: o.key })), Quiet: true },
    }));
  }
  return objs.length;
}
