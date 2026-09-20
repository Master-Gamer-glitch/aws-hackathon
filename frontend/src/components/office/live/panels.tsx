"use client";

// The panels of the live office. Everything shown here comes from the backend room being watched:
// its devices (with the hardware and tools they reported), its tasks, and its event stream.

import { useEffect, useState } from "react";
import { airstream, type BackendTask, type RoomDevice, type RoomStatus } from "@/lib/airstream/api";
import type { RoomWatch } from "@/lib/airstream/useRoom";
import { useStore } from "@office/store/store";
import { cn } from "@/lib/utils";

// ── small helpers ────────────────────────────────────────────────────────────

/** Re-render every `ms` so relative times ("3s ago") keep moving. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

export const ago = (ts: number | undefined, now: number): string => {
  if (!ts) return "never";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`;
};
const clock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false });

export const TASK_LABEL: Record<string, string> = {
  ready: "waiting", leased: "assigned", submitted: "verifying", verifying: "verifying", committed: "done", failed: "failed",
};

/** The tasks workers say they are building right now (from their latest heartbeats). */
function activeTaskIds(room: RoomStatus | null): Set<string> {
  const ids = new Set<string>();
  for (const d of room?.deviceStats.devices ?? []) if (d.status !== "offline" && d.metrics?.activeTaskId) ids.add(d.metrics.activeTaskId);
  return ids;
}

/** "building" only for the task a worker is actually on; other leased tasks are just "assigned". */
const labelFor = (t: BackendTask, active: Set<string>): string =>
  t.state === "leased" && active.has(t.taskId) ? "building" : (TASK_LABEL[t.state] ?? t.state);
const taskTone = (label: string) =>
  label === "done" ? "text-emerald-400" : label === "failed" ? "text-red-400" : label === "waiting" || label === "assigned" ? "text-slate-400" : "text-amber-300";

const eventTone = (type: string) =>
  /failed|offline/.test(type) ? "text-red-400" : /completed|joined|online|collected|created|distributed|passed/.test(type) ? "text-emerald-400" : "text-slate-300";

function CopyCommand({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(cmd); setDone(true); setTimeout(() => setDone(false), 1500); }
    catch { window.prompt("Copy this command", cmd); }
  };
  return (
    <div className="mt-2 flex items-start gap-2 rounded-md bg-crew-surface px-3 py-2">
      <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-slate-200">{cmd}</code>
      <button onClick={copy} className="shrink-0 rounded border border-crew-border-strong px-2 py-0.5 text-[11px] hover:bg-crew-hover">{done ? "Copied" : "Copy"}</button>
    </div>
  );
}

// ── header ───────────────────────────────────────────────────────────────────

export function Header({ roomId, watch, onChangeRoom }: { roomId: string; watch: RoomWatch; onChangeRoom: () => void }) {
  const { room, socket, latencyMs, error } = watch;
  const [copied, setCopied] = useState(false);
  const online = room?.deviceStats.online ?? 0;
  const total = room?.deviceStats.total ?? 0;
  const done = room?.taskStats.committed ?? 0;
  const tasks = room?.taskStats.total ?? 0;
  const copy = async () => {
    try { await navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { window.prompt("Room id", roomId); }
  };
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-crew-border bg-crew-bg px-4">
      <div className="flex items-center gap-3">
        <img src="/ultron-logo.png" alt="Ultron" className="h-6 w-auto" />
        <button onClick={copy} title="Copy room id" className="max-w-[260px] truncate rounded border border-crew-border px-2 py-0.5 font-mono text-[11px] text-slate-300 hover:bg-crew-hover">
          {copied ? "copied" : roomId}
        </button>
        {room && <span className="rounded bg-crew-surface px-2 py-0.5 font-mono text-[10px] uppercase text-slate-400">{room.status}</span>}
      </div>
      <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
        <span title="devices online / total">devices <b className="text-slate-200">{online}/{total}</b></span>
        <span title="tasks done / total">tasks <b className="text-slate-200">{done}/{tasks}</b></span>
        <span title="round trip of the last status read">api <b className={cn(error ? "text-red-400" : "text-slate-200")}>{error ? "error" : latencyMs != null ? `${latencyMs}ms` : "…"}</b></span>
        <span className="flex items-center gap-1.5" title="live event stream">
          <span className={cn("h-1.5 w-1.5 rounded-full", socket === "open" ? "bg-emerald-400" : socket === "connecting" ? "animate-pulse bg-amber-400" : "bg-red-400")} />
          events {socket}
        </span>
        <a href="/airstream/" className="rounded border border-crew-border px-2 py-0.5 hover:bg-crew-hover">console</a>
        <button onClick={onChangeRoom} className="rounded border border-crew-border px-2 py-0.5 hover:bg-crew-hover">rooms</button>
      </div>
    </header>
  );
}

// ── left: roster of real devices ─────────────────────────────────────────────

const dotFor = (status: string, offline: boolean) =>
  offline ? "bg-red-400" : status === "working" ? "animate-pulse bg-amber-400" : status === "success" ? "bg-emerald-400" : "bg-slate-500";

export function Roster({ room }: { room: RoomStatus | null }) {
  const agents = useStore((s) => s.agents);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const devices = new Map((room?.deviceStats.devices ?? []).map((d) => [d.deviceId, d]));
  return (
    <aside className="flex w-[210px] shrink-0 flex-col border-r border-crew-border bg-crew-bg">
      <div className="border-b border-crew-border px-3 py-2.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
        Devices <span className="ml-1 rounded bg-crew-surface px-1.5 text-slate-300">{agents.length}</span>
      </div>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {agents.map((a) => {
          const d = devices.get(a.id);
          const offline = d?.status === "offline";
          return (
            <li key={a.id}>
              <button onClick={() => select(a.id)}
                className={cn("w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
                  a.id === selectedId ? "border-red-500/50 bg-red-500/10" : "border-crew-border bg-crew-surface hover:bg-crew-hover")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs font-bold text-slate-100">{a.name}</span>
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotFor(a.status, offline))} />
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-1 font-mono text-[9px]">
                  <span className="truncate text-slate-500">{a.isGod ? "master" : "worker"}</span>
                  <span className={cn("uppercase", offline ? "text-red-400" : a.status === "working" ? "text-amber-300" : "text-slate-400")}>{offline ? "offline" : a.status}</span>
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-slate-500" title={a.action}>{a.action}</div>
              </button>
            </li>
          );
        })}
        {agents.length === 0 && <li className="px-2 py-4 text-center text-xs text-slate-500">No devices yet.</li>}
      </ul>
    </aside>
  );
}

// ── bottom: real connected devices ───────────────────────────────────────────

export function DevicesStrip({ room, roomId }: { room: RoomStatus | null; roomId: string }) {
  const now = useNow();
  const devices = room?.deviceStats.devices ?? [];
  const workers = devices.filter((d) => !d.isMaster).length;
  return (
    <section className="shrink-0 border-t border-crew-border bg-crew-bg">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
          Connected devices <span className="ml-1 rounded bg-emerald-500/15 px-1.5 text-emerald-300">{room?.deviceStats.online ?? 0} live</span>
        </span>
        <span className="font-mono text-[11px] text-slate-500">devices join by running a worker: <code className="text-slate-300">node worker/device-worker.mjs run --room {roomId}</code></span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-3">
        {devices.map((d) => <DeviceCard key={d.deviceId} d={d} now={now} />)}
        {workers === 0 && (
          <div className="flex min-w-[260px] flex-col justify-center rounded-lg border border-dashed border-crew-border px-4 py-3 text-xs text-slate-500">
            No worker has joined yet. The only device in this room is the master.
          </div>
        )}
      </div>
    </section>
  );
}

function DeviceCard({ d, now }: { d: RoomDevice; now: number }) {
  const c = d.capabilities;
  const offline = d.status === "offline";
  return (
    <div className="min-w-[250px] max-w-[300px] shrink-0 rounded-lg border border-crew-border bg-crew-surface px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-mono text-xs font-bold text-slate-100">{d.name}</span>
        <span className={cn("flex items-center gap-1.5 font-mono text-[10px]", offline ? "text-red-400" : "text-emerald-400")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", offline ? "bg-red-400" : "bg-emerald-400")} />{offline ? "Offline" : "Online"}
        </span>
      </div>
      <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
        {d.isMaster ? "Master" : "Worker"}{c ? ` · ${c.platform ?? "?"}${c.arch ? ` ${c.arch}` : ""}` : ""}
      </div>
      {c ? (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10px] text-slate-400">
          <span>CPU: <b className="text-slate-200">{c.cpuCount ?? "—"} cores{d.metrics?.cpuUsage != null && !offline ? ` · ${Math.round(d.metrics.cpuUsage)}%` : ""}</b></span>
          <span>RAM: <b className="text-slate-200">{c.memTotalGb != null ? `${c.memTotalGb} GB` : "—"}{d.metrics?.memUsage != null && !offline ? ` · ${Math.round(d.metrics.memUsage)}%` : ""}</b></span>
          <span title="time since the last heartbeat">Heartbeat: <b className={cn(offline ? "text-red-400" : "text-slate-200")}>{d.isMaster ? "n/a" : ago(d.lastHeartbeat, now)}</b></span>
          <span>Bench: <b className="text-slate-200">{c.benchScore ?? "—"}</b></span>
        </div>
      ) : (
        <div className="mt-2 font-mono text-[10px] text-slate-500">
          Hardware not reported. A browser cannot measure itself; run a worker to add a machine with real specs.
        </div>
      )}
      {c?.tools?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {c.tools.map((t) => <span key={t} className="rounded bg-crew-card px-1.5 py-0.5 font-mono text-[9px] text-slate-300">{t}</span>)}
        </div>
      ) : null}
    </div>
  );
}

// ── right: tabs ──────────────────────────────────────────────────────────────

export type PanelTab = "room" | "tasks" | "events" | "device";

export function RightPanel({ roomId, watch, tab, setTab }: { roomId: string; watch: RoomWatch; tab: PanelTab; setTab: (t: PanelTab) => void }) {
  const tabs: PanelTab[] = ["room", "tasks", "events", "device"];
  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-crew-border bg-crew-bg">
      <div role="tablist" className="grid grid-cols-4 border-b border-crew-border">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("px-2 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
              tab === t ? "border-b-2 border-red-500 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
            {t}{t === "tasks" && watch.tasks.length ? ` ${watch.tasks.length}` : ""}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "room" && <RoomPanel roomId={roomId} watch={watch} />}
        {tab === "tasks" && <TasksPanel watch={watch} />}
        {tab === "events" && <EventsPanel watch={watch} />}
        {tab === "device" && <DevicePanel watch={watch} />}
      </div>
    </aside>
  );
}

// Room: where things stand, what to do next, and the buttons that do it.

type Step = { text: string; cmd?: string; primary?: "distribute" | "collect" | "demo" };

function nextStep(room: RoomStatus, tasks: BackendTask[], roomId: string): Step {
  const workers = room.deviceStats.devices.filter((d) => !d.isMaster && d.status === "online").length;
  const { ready, leased, committed, failed, total } = room.taskStats;
  if (room.status === "demo_executed") return { text: "Done. The demo output is below. Plan again to start a new run." };
  if (total === 0 && tasks.length === 0) {
    return { text: "Plan what to build. A model on your machine splits it into tasks.", cmd: `node worker/device-worker.mjs plan "describe what to build" --room ${roomId}` };
  }
  if (workers === 0 && (ready > 0 || leased > 0)) {
    return { text: "Tasks are waiting for someone to build them. Start a worker on a machine that should help.", cmd: `node worker/device-worker.mjs run --room ${roomId}` };
  }
  if (ready > 0) return { text: `${ready} task${ready === 1 ? " is" : "s are"} waiting. Hand them to the ${workers} worker${workers === 1 ? "" : "s"}.`, primary: "distribute" };
  if (leased > 0) return { text: "Workers are building. This screen updates as each one finishes." };
  if (room.status === "integrated") return { text: "Code collected. Run it.", primary: "demo" };
  if (total > 0 && committed === total) return { text: "Every task is done. Merge the workers' files into one project.", primary: "collect" };
  if (failed > 0) return { text: `${failed} task${failed === 1 ? "" : "s"} failed. Re-plan, or distribute again once a worker is free.`, primary: "distribute" };
  return { text: "Waiting for activity." };
}

function RoomPanel({ roomId, watch }: { roomId: string; watch: RoomWatch }) {
  const { room, tasks, log, refresh } = watch;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ at: number; text: string } | null>(null);

  if (!room) return <p className="p-4 text-sm text-slate-500">{watch.error ?? "Connecting to the room…"}</p>;

  const step = nextStep(room, tasks, roomId);
  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label); setError(null);
    try { const text = await fn(); log(`local.${label}`, text); setLastResult({ at: Date.now(), text }); refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  };
  const actions: Array<{ id: "distribute" | "collect" | "demo"; label: string; go: () => Promise<string> }> = [
    { id: "distribute", label: "Distribute", go: async () => { const r = await airstream.distribute(roomId); return `Distributed ${r.tasksDistributed} task(s), ${r.tasksFailed} unassigned`; } },
    { id: "collect", label: "Collect code", go: async () => { const r = await airstream.collect(roomId); return r.filesIntegrated === 0 ? r.message : `Integrated ${r.filesIntegrated} file(s) from ${r.taskCount} task(s)${r.conflicts.length ? `, ${r.conflicts.length} conflict(s)` : ""}. Verify ${r.verifyStatus}`; } },
    { id: "demo", label: "Run demo", go: async () => { const r = await airstream.demo(roomId); return `Demo ${r.success ? "succeeded" : "failed"} — ${r.projectType}, ${r.timedOut ? "stopped at the time limit" : `exit ${r.exitCode}`}, ${r.runtime}ms`; } },
  ];
  const { taskStats: ts } = room;
  const active = activeTaskIds(room);
  const building = tasks.filter((t) => t.state === "leased" && active.has(t.taskId)).length;
  const pct = ts.total ? Math.round((ts.committed / ts.total) * 100) : 0;

  return (
    <div className="space-y-5 p-4">
      {error && <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}

      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Outcome</div>
        <p className="mt-1 text-sm text-slate-200">{room.outcome ?? <span className="text-slate-500">Not planned yet</span>}</p>
      </div>

      <div>
        <div className="mb-1 flex justify-between font-mono text-[10px] text-slate-500"><span>progress</span><span>{pct}%</span></div>
        <div className="h-2 overflow-hidden rounded bg-crew-surface" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex gap-4 font-mono text-[10px] text-slate-500">
          <span>waiting {ts.ready}</span><span>assigned {Math.max(0, ts.leased - building)}</span><span>building {building}</span><span>done {ts.committed}</span><span>failed {ts.failed}</span>
        </div>
      </div>

      <div className="rounded-lg border border-crew-border bg-crew-surface p-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Next step</div>
        <p className="mt-1 text-sm text-slate-200">{step.text}</p>
        {step.cmd && <CopyCommand cmd={step.cmd} />}
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button key={a.id} onClick={() => run(a.id, a.go)} disabled={busy !== null}
            className={cn("rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50",
              step.primary === a.id ? "bg-red-600 text-white hover:bg-red-500" : "border border-crew-border-strong hover:bg-crew-hover")}>
            {busy === a.id ? "Working…" : a.label}
          </button>
        ))}
      </div>

      {lastResult && (
        <p role="status" className="rounded-md bg-crew-surface px-3 py-2 font-mono text-[11px] text-slate-300">
          {clock(lastResult.at)} · {lastResult.text}
        </p>
      )}

      {room.masterDir && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Collected project</div>
          <p className="mt-1 break-all font-mono text-[11px] text-slate-300">{room.masterDir}</p>
        </div>
      )}

      {room.demoStatus && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Last demo · <span className={room.demoStatus.success ? "text-emerald-400" : "text-red-400"}>{room.demoStatus.success ? "ok" : "failed"}</span>
            {" "}· {room.demoStatus.projectType} · {room.demoStatus.timedOut ? "stopped at time limit" : `exit ${room.demoStatus.exitCode}`} · {room.demoStatus.runtime}ms
          </div>
          {room.demoStatus.outputTail && (
            <pre className="mt-1.5 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-crew-surface p-3 font-mono text-[11px] text-slate-300">{room.demoStatus.outputTail.trim()}</pre>
          )}
        </div>
      )}
    </div>
  );
}

// Tasks

function TasksPanel({ watch }: { watch: RoomWatch }) {
  const { tasks, room } = watch;
  const names = new Map((room?.deviceStats.devices ?? []).map((d) => [d.deviceId, d.name]));
  const active = activeTaskIds(room);
  if (tasks.length === 0) return <p className="p-4 text-sm text-slate-500">No tasks yet. Plan an outcome from the Room tab.</p>;
  return (
    <ul className="divide-y divide-crew-border">
      {tasks.map((t) => {
        const who = names.get(t.resultDeviceId ?? t.leaseOwner ?? "") ?? t.resultDeviceId ?? t.leaseOwner;
        return (
          <li key={t.taskId} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-sm text-slate-200">{t.objective ?? t.taskId}</span>
              <span className={cn("shrink-0 font-mono text-[10px] uppercase", taskTone(labelFor(t, active)))}>{labelFor(t, active)}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[10px] text-slate-500">
              {t.contract?.files?.length ? <span>{t.contract.files.join(", ")}</span> : null}
              {who && <span>{who}</span>}
              {t.attempts > 0 && <span>attempts {t.attempts}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Events

function EventsPanel({ watch }: { watch: RoomWatch }) {
  if (watch.feed.length === 0) return <p className="p-4 text-sm text-slate-500">Waiting for events. Anything that happens in this room shows up here as it happens.</p>;
  return (
    <ul className="px-4 py-2 font-mono text-[11px]" aria-live="polite">
      {watch.feed.map((f) => (
        <li key={f.id} className="flex gap-2 border-b border-crew-border/50 py-1.5 last:border-0">
          <span className="shrink-0 text-slate-500">{clock(f.ts)}</span>
          <span className={cn("break-words", eventTone(f.type))}>{f.message}</span>
        </li>
      ))}
    </ul>
  );
}

// Device: the selected character

function DevicePanel({ watch }: { watch: RoomWatch }) {
  const now = useNow();
  const selectedId = useStore((s) => s.selectedId);
  const feeds = useStore((s) => s.feeds);
  const agent = useStore((s) => s.agents.find((a) => a.id === s.selectedId));
  const d = watch.room?.deviceStats.devices.find((x) => x.deviceId === selectedId);
  if (!agent || !d) return <p className="p-4 text-sm text-slate-500">Select a device on the floor or in the list.</p>;

  const c = d.capabilities;
  const mine = watch.tasks.filter((t) => t.leaseOwner === d.deviceId || t.resultDeviceId === d.deviceId);
  const lines = feeds[d.deviceId] ?? [];
  const rows: Array<[string, string]> = [
    ["role", d.isMaster ? "master" : "worker"],
    ["status", d.status],
    ["doing", agent.action],
    ["platform", c ? `${c.platform ?? "?"} ${c.arch ?? ""}`.trim() : "not reported"],
    ["cpu", c ? `${c.cpuCount ?? "?"} cores` : "?"],
    ["memory", c?.memTotalGb != null ? `${c.memTotalGb} GB` : "?"],
    ["benchmark", String(c?.benchScore ?? "?")],
    ["heartbeat", d.isMaster ? "n/a (master)" : ago(d.lastHeartbeat, now)],
    ["device id", d.deviceId],
  ];
  return (
    <div className="space-y-5 p-4">
      <div className="text-base font-semibold text-slate-100">{d.name}</div>
      <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1 font-mono text-[11px]">
        {rows.map(([k, v]) => (<div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="break-all text-slate-300">{v}</dd></div>))}
      </dl>
      {c?.tools?.length ? (
        <div className="flex flex-wrap gap-1">{c.tools.map((t) => <span key={t} className="rounded bg-crew-surface px-1.5 py-0.5 font-mono text-[10px] text-slate-300">{t}</span>)}</div>
      ) : null}

      <div>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">Tasks</div>
        {mine.length === 0 ? <p className="text-xs text-slate-500">None yet.</p> : (
          <ul className="space-y-1">
            {mine.map((t) => (
              <li key={t.taskId} className="flex justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-slate-300">{t.objective ?? t.taskId}</span>
                <span className={cn("shrink-0 font-mono text-[10px] uppercase", taskTone(labelFor(t, activeTaskIds(watch.room))))}>{labelFor(t, activeTaskIds(watch.room))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">Activity</div>
        {lines.length === 0 ? <p className="text-xs text-slate-500">Nothing yet.</p> : (
          <ul className="space-y-0.5 font-mono text-[11px] text-slate-300">
            {[...lines].reverse().map((l, i) => <li key={i} className="break-words">{l}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
