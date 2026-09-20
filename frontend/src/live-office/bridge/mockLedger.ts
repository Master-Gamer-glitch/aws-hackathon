// Mock TASK DATA — the CrewDesk task ledger.
//
// The office scene polls `window.cth.hiveTasks()` (see initCth.ts) and animates
// every ledger change: an agent walks to the wall boards to pin a new task, takes
// a card to their desk when they start it, files it on the archive table when it
// is done, and walks to the door when a card is blocked on the human.
//
// This module is the local stand-in for the backend ledger. It also drives a bit of
// agent state (status / lastPrompt / blockReason) so tasks and characters agree.
// To go live, replace `getLedger()` with a fetch/stream from the CrewDesk backend
// (SQS → Step Functions → AgentCore events) and call `emit()` on each update.

import { useStore } from '../store/store';

export type LedgerStatus = 'todo' | 'doing' | 'blocked' | 'done';

export interface LedgerTask {
  id: string;
  title: string;
  status: LedgerStatus;
  /** agent id */
  assignee?: string;
  humanQA?: Array<{ q: string; a?: string }>;
  createdAt: number;
  updatedAt: number;
}

const TEMPLATES: Record<string, string[]> = {
  lead: ['Standup & sync floor state', 'Re-plan the DAG for launch', 'Review mission budget ceiling'],
  coder: ['Refactor auth middleware AST', 'Wire Step Functions state machine', 'Stream agent status over SSE'],
  design: ['Tune cream design tokens', 'Pixel-polish the command center', 'Draft empty-state illustrations'],
  qa: ['Compile Cedar permission policies', 'Regression suite for sprite lifecycle', 'Audit sandbox boundaries'],
  research: ['Re-index the OpenSearch knowledge base', 'Cite sources for onboarding docs', 'Cluster new support transcripts'],
  marketing: ['Draft the v1.0 changelog', 'Prepare launch announcement', 'Update deployment docs'],
};

const APPROVAL_QUESTIONS = [
  'Approve deploying the staging build to the shared microVM pool?',
  'This task wants to spend an extra $0.60 of budget. Approve?',
  'Cedar policy update touches production scope. OK to apply?',
];

let seq = 100;
let tasks: LedgerTask[] = [];
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let autoApprove = false;
const blockedSince = new Map<string, number>();

// LIVE MODE — when the Airstream backend is the source of truth (see liveLedger.ts),
// the simulation is off and `tasks` is the backend list plus any cards typed in this
// browser (the backend has no "add a card" endpoint; outcomes go through the lead agent).
let live = false;
const localIds = new Set<string>();       // cards created in this browser while live
const dismissedRemote = new Set<string>(); // failed backend cards the human acknowledged

const now = () => Date.now();
const nextId = () => `T-${++seq}`;
const agentIds = () => useStore.getState().agents.filter((a) => !a.archived).map((a) => a.id);
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function emit(): void {
  tasks = [...tasks];              // new identity so useSyncExternalStore consumers re-render
  listeners.forEach((l) => l());
}

function seedIfEmpty(): void {
  if (live || tasks.length) return;
  const t0 = now();
  const mk = (title: string, status: LedgerStatus, assignee: string, age: number): LedgerTask =>
    ({ id: nextId(), title, status, assignee, createdAt: t0 - age, updatedAt: t0 - age });
  tasks = [
    mk('Bootstrap office floor scene', 'done', 'coder', 600_000),
    mk('Standup & sync floor state', 'doing', 'lead', 90_000),
    mk('Compile Cedar permission policies', 'doing', 'qa', 60_000),
    mk('Optimize sprite rendering pipeline', 'todo', 'design', 30_000),
    mk('Re-index the OpenSearch knowledge base', 'todo', 'research', 20_000),
    mk('Draft the v1.0 changelog', 'todo', 'marketing', 10_000),
  ];
}

// ── read API (used by window.cth.hiveTasks and the Tasks tab) ────────────────
export function getLedger(): LedgerTask[] { seedIfEmpty(); return tasks; }

export function subscribeLedger(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

// ── write API (used by the UI) ───────────────────────────────────────────────
export function addLedgerTask(title: string, assignee?: string): LedgerTask {
  const t: LedgerTask = { id: nextId(), title, status: 'todo', assignee, createdAt: now(), updatedAt: now() };
  if (live) localIds.add(t.id);
  tasks = [...tasks, t];
  emit();
  return t;
}

export function setAutoApprove(on: boolean): void { autoApprove = on; }

/** Switch between the built-in simulation and the backend-fed ledger. Going live drops
 *  the seeded/simulated cards so only real work is shown. */
export function setLedgerLive(on: boolean): void {
  if (live === on) return;
  live = on;
  localIds.clear();
  dismissedRemote.clear();
  tasks = [];
  emit();
}

/** Live mode: replace the backend-owned cards with a fresh snapshot, keeping local ones. */
export function replaceRemoteTasks(remote: LedgerTask[]): void {
  const local = tasks.filter((x) => localIds.has(x.id));
  const next = remote.map((x) =>
    x.status === 'blocked' && dismissedRemote.has(x.id) ? { ...x, status: 'done' as const } : x);
  tasks = [...local, ...next];
  emit();
}

/** Resolve a blocked card: the human approved (or denied) the agent's question. */
export function resolveBlocked(taskId: string, approved: boolean): void {
  const t = tasks.find((x) => x.id === taskId);
  if (!t || t.status !== 'blocked') return;
  // A blocked backend card is a failed task. There is nothing to approve on the server,
  // so the human's answer just acknowledges it and moves the card to the archive.
  if (live && !localIds.has(taskId)) {
    dismissedRemote.add(taskId);
    t.status = 'done';
    t.updatedAt = now();
    emit();
    return;
  }
  blockedSince.delete(taskId);
  t.humanQA = (t.humanQA ?? []).map((e) => (e.a ? e : { ...e, a: approved ? 'approved' : 'denied' }));
  t.status = approved ? 'doing' : 'done';
  t.updatedAt = now();
  const st = useStore.getState();
  if (t.assignee) {
    st.updateAgent(t.assignee, {
      status: approved ? 'thinking' : 'success',
      action: approved ? 'approved — resuming' : 'denied — standing down',
      currentStation: 'desk',
      blockReason: undefined,
    });
    st.pushFeed(t.assignee, approved ? `\x1b[32m✓ approved\x1b[0m ${t.title}` : `\x1b[31m✗ denied\x1b[0m ${t.title}`);
  }
  emit();
}

// ── simulation ───────────────────────────────────────────────────────────────
function tick(): void {
  const st = useStore.getState();
  const t = now();
  let changed = false;

  // 1) resolve blocked cards (auto mode approves quickly; otherwise the human has ~60s)
  for (const task of tasks) {
    if (task.status !== 'blocked') continue;
    const since = blockedSince.get(task.id) ?? t;
    if (t - since > (autoApprove ? 4_000 : 60_000)) { resolveBlocked(task.id, true); changed = true; }
  }

  const open = tasks.filter((x) => x.status !== 'done');
  const doing = tasks.filter((x) => x.status === 'doing');
  const blocked = tasks.filter((x) => x.status === 'blocked');

  // 2) start a todo card
  const todo = tasks.find((x) => x.status === 'todo' && x.assignee);
  if (todo && doing.length < 3 && Math.random() < 0.6) {
    todo.status = 'doing'; todo.updatedAt = t; changed = true;
    if (todo.assignee) {
      st.updateAgent(todo.assignee, { lastPrompt: todo.title, status: 'thinking', action: 'heading to terminal', currentStation: 'terminal' });
      st.pushFeed(todo.assignee, `\x1b[36m● Task\x1b[0m ${todo.id} ${todo.title}`);
    }
  }

  // 3) finish or block a doing card that has been running a while
  for (const task of doing) {
    if (t - task.updatedAt < 14_000) continue;
    const r = Math.random();
    if (r < 0.10 && blocked.length === 0 && task.assignee && task.assignee !== 'lead') {
      task.status = 'blocked'; task.updatedAt = t; changed = true;
      const q = rand(APPROVAL_QUESTIONS);
      task.humanQA = [{ q }];
      blockedSince.set(task.id, t);
      st.updateAgent(task.assignee, {
        status: 'blocked', action: 'needs your approval', currentStation: 'desk',
        blockReason: {
          summary: 'Approval needed', detail: q,
          actions: [{ label: 'Approve', kind: 'approve' }, { label: 'Deny', kind: 'deny' }],
        },
      });
      st.pushFeed(task.assignee, `\x1b[33m! blocked\x1b[0m ${task.title} — waiting for approval`);
      break;
    }
    if (r < 0.45) {
      task.status = 'done'; task.updatedAt = t; changed = true;
      if (task.assignee) {
        st.updateAgent(task.assignee, { status: 'success', action: 'task complete', currentStation: 'desk', carrying: undefined });
        st.pushFeed(task.assignee, `\x1b[32m✓ done\x1b[0m ${task.id} ${task.title}`);
      }
    }
  }

  // 4) keep the board topped up
  if (open.length < 6 && Math.random() < 0.5) {
    const id = rand(agentIds());
    if (id) {
      const title = rand(TEMPLATES[id] ?? ['Triage the backlog']);
      tasks = [...tasks, { id: nextId(), title, status: 'todo', assignee: id, createdAt: t, updatedAt: t }];
      changed = true;
    }
  }

  // 5) cap history so the archive doesn't grow forever
  const done = tasks.filter((x) => x.status === 'done');
  if (done.length > 10) {
    const drop = new Set(done.sort((a, b) => a.updatedAt - b.updatedAt).slice(0, done.length - 10).map((x) => x.id));
    tasks = tasks.filter((x) => !drop.has(x.id));
    changed = true;
  }

  if (changed) emit();
}

export function startMockLedger(): void {
  seedIfEmpty();
  if (timer) return;
  timer = setInterval(tick, 6_000);
}

export function stopMockLedger(): void {
  if (timer) { clearInterval(timer); timer = null; }
}
