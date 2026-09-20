// LIVE TASK LEDGER — maps a room's real backend tasks onto the office task ledger, which is what
// the wall boards and task cards in the scene read (through window.cth.hiveTasks()).
//
// It only translates tasks. Which character does what is decided from the same tasks by
// liveRoster.ts, so the two can never disagree.

import type { BackendTask, BackendTaskState } from '@/lib/airstream/api';
import { useStore } from '../store/store';
import { replaceRemoteTasks, setLedgerLive, type LedgerStatus, type LedgerTask } from './mockLedger';

const STATUS_OF: Record<BackendTaskState, LedgerStatus> = {
  ready: 'todo',
  leased: 'doing',
  submitted: 'doing',
  verifying: 'doing',
  committed: 'done',
  failed: 'blocked', // needs a human; acknowledging it archives the card
};

/** A task is owned by a device. The card gets an assignee (and so animates that character on the
 *  floor) when the device is on the roster, which in live mode it is. */
function resolveAssignee(t: BackendTask): string | undefined {
  const known = new Set(useStore.getState().agents.map((a) => a.id));
  for (const c of [t.leaseOwner, t.resultDeviceId]) if (c && known.has(c)) return c;
  return undefined;
}

// The list endpoint carries no timestamps, so remember when each task was first seen and last changed.
const seen = new Map<string, { status: LedgerStatus; createdAt: number; updatedAt: number }>();

function toLedger(tasks: BackendTask[]): LedgerTask[] {
  const now = Date.now();
  const out: LedgerTask[] = [];
  for (const t of tasks) {
    const status = STATUS_OF[t.state] ?? 'todo';
    const prev = seen.get(t.taskId);
    const rec = prev
      ? (prev.status === status ? prev : { ...prev, status, updatedAt: now })
      : { status, createdAt: t.createdAt ?? now, updatedAt: now };
    seen.set(t.taskId, rec);

    const title = t.objective || t.taskId;
    out.push({
      id: t.taskId,
      title,
      status,
      assignee: resolveAssignee(t),
      humanQA: status === 'blocked'
        ? [{ q: `“${title}” failed after ${t.attempts} attempt${t.attempts === 1 ? '' : 's'}. Acknowledge it?` }]
        : undefined,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    });
  }
  const ids = new Set(tasks.map((t) => t.taskId));
  for (const id of seen.keys()) if (!ids.has(id)) seen.delete(id);
  return out;
}

/** Switch the ledger from the simulation to real tasks. Drops the simulated cards. */
export function beginLiveLedger(): void {
  seen.clear();
  setLedgerLive(true);
}

/** Replace the ledger with this snapshot of the room's tasks. */
export function applyLiveTasks(tasks: BackendTask[]): void {
  replaceRemoteTasks(toLedger(tasks));
}

/** Back to the simulation's ledger. */
export function endLiveLedger(): void {
  seen.clear();
  setLedgerLive(false);
}
