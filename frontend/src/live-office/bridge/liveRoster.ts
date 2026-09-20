// LIVE ROSTER — turns a backend room into the office roster: one character per real device.
//
//   master device      -> the boss ("god") character, in the Command Center
//   every other device -> a worker character at an open-plan desk
//
// What a character is doing is derived from the room's tasks on every poll, not from remembered
// transitions, so a missed update can never leave someone stuck. A separate diff of two
// consecutive polls produces the per-device event lines.

import type { BackendTask, RoomDevice, RoomStatus } from '@/lib/airstream/api';
import type { Agent, StationKind, ToolKind } from '../store/store';

const CHARACTERS: Agent['character'][] = ['jim', 'pam', 'dwight', 'angela', 'ryan', 'kevin', 'oscar', 'phyllis', 'andy', 'toby', 'kelly'];
const ACCENTS: Agent['accent'][] = ['sky', 'peach', 'mint', 'lilac', 'coral', 'lemon'];

/** Stable pick: the same device always gets the same face. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function describeDevice(d: RoomDevice): string {
  const c = d.capabilities;
  if (!c) return d.isMaster ? 'Master device' : 'Device';
  const bits = [c.platform, c.cpuCount ? `${c.cpuCount} cpu` : null, c.tools?.length ? c.tools.slice(0, 4).join(', ') : null].filter(Boolean);
  return `${d.isMaster ? 'Master · ' : ''}${bits.join(' · ')}`;
}

export interface Activity {
  status: Agent['status'];
  action: string;
  station: StationKind;
  carrying?: ToolKind;
}

/** A short-lived override: the "task complete" flash, or the master running collect/demo. */
export interface Override { status: Agent['status']; action: string; station?: StationKind; carrying?: ToolKind; until: number }

/** What a device is doing right now, from its tasks (and the room, for the master). */
export function activityFor(d: RoomDevice, tasks: BackendTask[], room: RoomStatus, override?: Override, now = Date.now()): Activity {
  if (override && override.until > now) {
    return { status: override.status, action: override.action, station: override.station ?? 'desk', carrying: override.carrying };
  }
  if (d.status === 'offline') return { status: 'idle', action: 'offline — no heartbeat', station: 'desk' };

  if (d.isMaster) {
    const open = tasks.filter((t) => t.state !== 'committed' && t.state !== 'failed').length;
    if (open > 0) return { status: 'working', action: `coordinating ${open} open task${open === 1 ? '' : 's'}`, station: 'desk' };
    if (room.status === 'integrated') return { status: 'idle', action: 'code collected — ready to demo', station: 'desk' };
    if (room.status === 'demo_executed') return { status: 'idle', action: 'demo finished', station: 'desk' };
    return { status: 'idle', action: tasks.length ? 'all tasks finished' : 'waiting for a plan', station: 'desk' };
  }

  const mine = tasks.filter((t) => t.leaseOwner === d.deviceId);
  const leased = mine.filter((t) => t.state === 'leased');
  // The worker says which task it is on in every heartbeat. Tasks it holds but has not started are
  // only "assigned". An old heartbeat is not trusted.
  const fresh = now - (d.lastHeartbeat ?? 0) < 20_000;
  const activeId = fresh ? d.metrics?.activeTaskId : undefined;
  const building = leased.find((t) => t.taskId === activeId);
  if (building) return { status: 'working', action: `building: ${building.objective ?? building.taskId}`, station: 'desk', carrying: 'Write' };
  if (leased.length) return { status: 'working', action: `${leased.length} task${leased.length === 1 ? '' : 's'} assigned, starting`, station: 'desk' };
  const submitting = mine.find((t) => t.state === 'submitted' || t.state === 'verifying');
  if (submitting) return { status: 'working', action: `submitting: ${submitting.objective ?? submitting.taskId}`, station: 'desk', carrying: 'Bash' };
  return { status: 'idle', action: 'waiting for tasks', station: 'desk' };
}

/**
 * The next roster. Existing characters keep their identity (so the floor does not rebuild them);
 * only descriptors and what they are doing are refreshed.
 */
export function buildRoster(
  room: RoomStatus,
  tasks: BackendTask[],
  existing: Agent[],
  overrides: Record<string, Override>,
  now = Date.now(),
): Agent[] {
  const byId = new Map(existing.map((a) => [a.id, a]));
  const devices = [...room.deviceStats.devices].sort((a, b) => Number(b.isMaster) - Number(a.isMaster) || a.name.localeCompare(b.name));

  return devices.map((d) => {
    const act = activityFor(d, tasks, room, overrides[d.deviceId], now);
    const prev = byId.get(d.deviceId);
    const claude = d.capabilities?.tools?.includes('claude');
    const descriptors = {
      name: d.name,
      description: describeDevice(d),
      isGod: d.isMaster,
      model: claude ? 'Claude Code' : undefined,
    };
    const runState = {
      status: act.status,
      action: act.action,
      currentStation: act.station,
      carrying: act.carrying,
    };
    if (prev) return { ...prev, ...descriptors, ...runState };
    const h = hash(d.deviceId);
    return {
      id: d.deviceId,
      character: d.isMaster ? 'michael' : CHARACTERS[h % CHARACTERS.length],
      accent: ACCENTS[(h >>> 3) % ACCENTS.length],
      project: room.roomId,
      tmuxTarget: '',
      cwd: '',
      progress: 0,
      ...descriptors,
      ...runState,
      recentTextTs: now,
    } as Agent;
  });
}

/** True when nothing a viewer can see differs, so the store is not touched (and the scene not re-synced). */
export function sameRoster(a: Agent[], b: Agent[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => {
    const y = b[i];
    return x.id === y.id && x.name === y.name && x.description === y.description && x.isGod === y.isGod
      && x.status === y.status && x.action === y.action && x.currentStation === y.currentStation && x.carrying === y.carrying;
  });
}

// ── per-device event lines, from the difference between two polls ────────────

export interface Snapshot { devices: RoomDevice[]; tasks: BackendTask[] }
export interface DeviceLine { deviceId: string; line: string; /** finished a task: flash a "complete" state */ finished?: boolean }

export function diffSnapshots(prev: Snapshot | null, next: Snapshot, masterId: string | null): DeviceLine[] {
  if (!prev) return [];
  const out: DeviceLine[] = [];
  const prevDev = new Map(prev.devices.map((d) => [d.deviceId, d]));
  const prevTask = new Map(prev.tasks.map((t) => [t.taskId, t]));
  const nameOf = new Map(next.devices.map((d) => [d.deviceId, d.name]));

  for (const d of next.devices) {
    const p = prevDev.get(d.deviceId);
    if (!p) out.push({ deviceId: d.deviceId, line: `joined the room${d.capabilities?.tools?.length ? ` — ${d.capabilities.tools.join(', ')}` : ''}` });
    else if (p.status !== 'offline' && d.status === 'offline') out.push({ deviceId: d.deviceId, line: 'went offline (no heartbeat for 30s)' });
    else if (p.status === 'offline' && d.status !== 'offline') out.push({ deviceId: d.deviceId, line: 'back online' });
  }

  for (const t of next.tasks) {
    const p = prevTask.get(t.taskId);
    const what = t.objective ?? t.taskId;
    if (!p) { if (masterId) out.push({ deviceId: masterId, line: `planned: ${what}` }); continue; }
    if (p.state === t.state && p.leaseOwner === t.leaseOwner) continue;

    if (t.state === 'leased' && t.leaseOwner) out.push({ deviceId: t.leaseOwner, line: `picked up: ${what}` });
    else if (t.state === 'committed') {
      const who = t.resultDeviceId ?? t.leaseOwner ?? p.leaseOwner;
      if (who) out.push({ deviceId: who, line: `finished: ${what} — verified`, finished: true });
    } else if (t.state === 'failed') {
      const who = t.leaseOwner ?? p.leaseOwner ?? masterId;
      if (who) out.push({ deviceId: who, line: `failed: ${what}` });
    } else if (t.state === 'ready' && p.state === 'leased' && p.leaseOwner) {
      out.push({ deviceId: p.leaseOwner, line: `lost the lease on: ${what} (${nameOf.get(p.leaseOwner) ? 'reassigned' : 'device gone'})` });
    }
  }
  return out;
}
