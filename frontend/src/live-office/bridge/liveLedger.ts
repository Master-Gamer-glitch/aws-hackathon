// LIVE TASK LEDGER — feeds the office floor from the Airstream backend instead of the
// built-in simulation (mockLedger.ts). Enabled with NEXT_PUBLIC_LIVE_BACKEND=true.
//
// Source of truth: GET /projects/{id}/tasks, polled, plus an immediate re-read whenever
// the WebSocket stream reports something that changes tasks. The scene itself is
// untouched — it already polls `window.cth.hiveTasks()` and animates every change.

import { airstream, type BackendTask, type BackendTaskState } from '@/lib/airstream/api';
import { LEDGER_POLL_MS } from '@/lib/airstream/config';
import { connectAirstream, type SocketState } from '@/lib/airstream/socket';
import { useStore } from '../store/store';
import { replaceRemoteTasks, setLedgerLive, type LedgerStatus, type LedgerTask } from './mockLedger';

// ── connection status (tiny external store, read with useSyncExternalStore) ──

export interface LiveStatus {
  /** 'off' until started; 'live' after a successful read; 'error' after a failed one */
  phase: 'off' | 'connecting' | 'live' | 'error';
  socket: SocketState;
  lastSync: number | null;
  error: string | null;
}

const OFF: LiveStatus = { phase: 'off', socket: 'closed', lastSync: null, error: null };
let status: LiveStatus = OFF;
const statusListeners = new Set<() => void>();

function setStatus(patch: Partial<LiveStatus>): void {
  status = { ...status, ...patch };
  statusListeners.forEach((l) => l());
}

export const getLiveStatus = (): LiveStatus => status;
export const subscribeLiveStatus = (cb: () => void): (() => void) => {
  statusListeners.add(cb);
  return () => { statusListeners.delete(cb); };
};

// ── mapping ──────────────────────────────────────────────────────────────────

const STATUS_OF: Record<BackendTaskState, LedgerStatus> = {
  ready: 'todo',
  leased: 'doing',
  submitted: 'doing',
  verifying: 'doing',
  committed: 'done',
  failed: 'blocked', // needs a human; acknowledging it archives the card
};

/** Tasks are owned by a device, not a crew member. The card only gets an assignee (and
 *  so only animates a character) when the backend names one of the roster's agent ids —
 *  `ownerAgent` from the task contract if the API exposes it, else the lease owner. */
function resolveAssignee(t: BackendTask & { ownerAgent?: string | null }): string | undefined {
  const known = new Set(useStore.getState().agents.filter((a) => !a.archived).map((a) => a.id));
  for (const c of [t.ownerAgent, t.leaseOwner, t.resultDeviceId]) {
    if (c && known.has(c)) return c;
  }
  return undefined;
}

// First-seen / last-changed times: the list endpoint carries no timestamps.
const seen = new Map<string, { status: LedgerStatus; createdAt: number; updatedAt: number }>();

function toLedger(tasks: BackendTask[], announce: boolean): LedgerTask[] {
  const now = Date.now();
  const out: LedgerTask[] = [];
  for (const t of tasks) {
    const status = STATUS_OF[t.state] ?? 'todo';
    const prev = seen.get(t.taskId);
    const rec = prev
      ? (prev.status === status ? prev : { ...prev, status, updatedAt: now })
      : { status, createdAt: now, updatedAt: now };
    seen.set(t.taskId, rec);

    const assignee = resolveAssignee(t);
    const title = t.objective || t.taskId;
    const changed = !prev || prev.status !== status;
    if (announce && changed && assignee) reflectOnAgent(assignee, t.taskId, title, status, t);

    out.push({
      id: t.taskId,
      title,
      status,
      assignee,
      humanQA: status === 'blocked'
        ? [{ q: `“${title}” failed after ${t.attempts} attempt${t.attempts === 1 ? '' : 's'}. Acknowledge it?` }]
        : undefined,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    });
  }
  // forget cards the backend no longer lists
  const ids = new Set(tasks.map((t) => t.taskId));
  for (const id of seen.keys()) if (!ids.has(id)) seen.delete(id);
  return out;
}

/** Keep the character and its terminal feed in step with a real state change. */
function reflectOnAgent(agentId: string, taskId: string, title: string, s: LedgerStatus, t: BackendTask): void {
  const st = useStore.getState();
  if (s === 'doing') {
    st.updateAgent(agentId, { lastPrompt: title, status: 'thinking', action: 'heading to terminal', currentStation: 'terminal' });
    st.pushFeed(agentId, `\x1b[36m● Task\x1b[0m ${taskId} ${title}`);
  } else if (s === 'done') {
    st.updateAgent(agentId, { status: 'success', action: 'task complete', currentStation: 'desk', carrying: undefined });
    st.pushFeed(agentId, `\x1b[32m✓ done\x1b[0m ${taskId} ${title}`);
  } else if (s === 'blocked') {
    const detail = `Failed after ${t.attempts} attempt${t.attempts === 1 ? '' : 's'}.`;
    st.updateAgent(agentId, {
      status: 'blocked', action: 'task failed', currentStation: 'desk',
      blockReason: { summary: 'Task failed', detail, actions: [{ label: 'Acknowledge', kind: 'neutral' }] },
    });
    st.pushFeed(agentId, `\x1b[31m✗ failed\x1b[0m ${taskId} ${title}`);
  }
}

// ── loop ─────────────────────────────────────────────────────────────────────

/** WebSocket event types after which the task list is worth re-reading right away. */
const TASK_EVENTS = /^(task\.|tasks\.|code\.|demo\.|status\.)/;

export function startLiveLedger(): () => void {
  setLedgerLive(true);
  seen.clear();
  setStatus({ phase: 'connecting', error: null });

  let stopped = false;
  let first = true;
  let inFlight = false;
  let nudge: ReturnType<typeof setTimeout> | null = null;

  const refresh = async (): Promise<void> => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const tasks = await airstream.listTasks();
      if (stopped) return;
      // The first read is history: place cards on the board without replaying a state
      // change for every one of them.
      replaceRemoteTasks(toLedger(tasks, !first));
      first = false;
      setStatus({ phase: 'live', lastSync: Date.now(), error: null });
    } catch (e) {
      if (!stopped) setStatus({ phase: 'error', error: e instanceof Error ? e.message : String(e) });
    } finally {
      inFlight = false;
    }
  };

  void refresh();
  const poll = setInterval(() => { if (!document.hidden) void refresh(); }, LEDGER_POLL_MS);

  const socket = connectAirstream({
    onState: (s) => { if (!stopped) setStatus({ socket: s }); },
    onEvent: (e) => {
      if (!TASK_EVENTS.test(e.type) || nudge) return;
      nudge = setTimeout(() => { nudge = null; void refresh(); }, 400); // coalesce bursts
    },
  });

  return () => {
    stopped = true;
    clearInterval(poll);
    if (nudge) clearTimeout(nudge);
    socket.close();
    setLedgerLive(false);
    seen.clear();
    status = OFF;
    statusListeners.forEach((l) => l());
  };
}
