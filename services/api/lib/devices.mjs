// Whether a device is really alive.
//
// The stored `status` is only corrected when some device sends a heartbeat (the sweep runs inside
// the heartbeat handler). If every device goes quiet, nothing corrects it, and a dead worker would
// look online forever and keep being handed tasks. So anyone reading device state should derive it
// from the last heartbeat instead of trusting the stored value.

export const OFFLINE_THRESHOLD_MS = 30_000;

export function effectiveStatus(device, now = Date.now()) {
  // the master is a person's browser or terminal that does not heartbeat; it is never swept
  if (device.isMaster) return device.status;
  return now - (device.lastHeartbeat || 0) > OFFLINE_THRESHOLD_MS ? 'offline' : device.status;
}

/**
 * Heartbeat metrics are client-supplied and get stored and shown to everyone in the room, so keep
 * only what is understood: percentages (0-100), a small task count, and the id of the task the
 * device is building right now.
 */
export function sanitizeMetrics(m) {
  if (!m || typeof m !== 'object') return {};
  const pct = (v) => (Number.isFinite(Number(v)) ? Math.min(100, Math.max(0, Math.round(Number(v) * 10) / 10)) : undefined);
  const out = {};
  const cpu = pct(m.cpuUsage); if (cpu !== undefined) out.cpuUsage = cpu;
  const mem = pct(m.memUsage); if (mem !== undefined) out.memUsage = mem;
  if (Number.isFinite(Number(m.activeTaskCount))) out.activeTaskCount = Math.min(99, Math.max(0, Math.round(Number(m.activeTaskCount))));
  if (typeof m.activeTaskId === 'string' && m.activeTaskId.length <= 80) out.activeTaskId = m.activeTaskId;
  return out;
}
