// A device knows its own hardware and tools; the Lambda that handles the join does not.
// Devices report what they have, and this makes that safe to store and score.

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const num = (v, fallback, lo, hi) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

/** Returns the cleaned capabilities, or null when the device reported none (caller falls back). */
export function sanitizeCapabilities(c) {
  if (!c || typeof c !== 'object' || !Array.isArray(c.tools)) return null;

  const tools = [...new Set(
    c.tools.filter((t) => typeof t === 'string').map((t) => t.trim().slice(0, 40)).filter(Boolean),
  )].slice(0, 32);

  const memTotal = num(c.memTotalGb, 0, 0, 100000);
  const memFree = num(c.memFreeGb, memTotal, 0, 100000);
  return {
    platform: str(c.platform, 20) ?? 'unknown',
    arch: str(c.arch, 20) ?? 'unknown',
    cpuCount: Math.round(num(c.cpuCount, 1, 1, 4096)),
    cpuModel: str(c.cpuModel, 80) ?? 'unknown',
    memTotalGb: memTotal.toFixed(1),
    memFreeGb: memFree.toFixed(1),
    memUsedPercent: memTotal > 0 ? (((memTotal - memFree) / memTotal) * 100).toFixed(1) : '0.0',
    benchScore: num(c.benchScore, 1, 0, 10),
    tools,
    nodeVersion: str(c.nodeVersion, 20),
    reportedByDevice: true,
  };
}
