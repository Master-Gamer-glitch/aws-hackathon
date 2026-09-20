"use client";

// Airstream console — create or join a device room, keep this device alive with
// heartbeats, watch room/task state, and drive distribute → collect → demo.
// Talks to the backend only through lib/airstream (REST proxy + WebSocket stream).

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { airstream, ApiError, type RoomStatus } from "@/lib/airstream/api";
import { HEARTBEAT_INTERVAL_MS, PROJECT_ID } from "@/lib/airstream/config";
import { connectAirstream, type AirstreamEvent, type SocketState } from "@/lib/airstream/socket";
import { cn } from "@/lib/utils";

type Role = "master" | "slave";
interface Session { roomId: string; deviceId: string; role: Role; name: string }
interface FeedItem { id: number; ts: number; type: string; message: string }

const SESSION_KEY = "airstream.session.v1";
const NAME_KEY = "airstream.deviceName.v1";
const STATUS_POLL_MS = 3_000;
const FEED_LIMIT = 100;

// localStorage can throw (private mode, blocked storage) — never let that break the page.
const store = {
  get(key: string): string | null { try { return window.localStorage.getItem(key); } catch { return null; } },
  set(key: string, v: string) { try { window.localStorage.setItem(key, v); } catch { /* ignore */ } },
  del(key: string) { try { window.localStorage.removeItem(key); } catch { /* ignore */ } },
};

function loadSession(): Session | null {
  const raw = store.get(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<Session>;
    if (s.roomId && s.deviceId && (s.role === "master" || s.role === "slave") && s.name) return s as Session;
  } catch { /* fall through */ }
  return null;
}

const errText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : String(e));
const clock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false });
const pct = (p: string | number) => Math.max(0, Math.min(100, parseFloat(String(p)) || 0));

function tone(type: string): string {
  if (/failed|offline/.test(type)) return "text-crew-error";
  if (/completed|joined|online|collected|created|distributed/.test(type)) return "text-crew-success";
  if (/warn|redistributed/.test(type)) return "text-crew-warning";
  return "text-crew-text-secondary";
}

export default function AirstreamConsole() {
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("My Browser");
  const [joinId, setJoinId] = useState("");
  const [room, setRoom] = useState<RoomStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<SocketState>("closed");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [copied, setCopied] = useState(false);
  const feedSeq = useRef(0);
  const refreshRef = useRef<() => void>(() => {});

  const log = useCallback((type: string, message: string) => {
    setFeed((f) => [{ id: ++feedSeq.current, ts: Date.now(), type, message }, ...f].slice(0, FEED_LIMIT));
  }, []);

  // restore identity, prior session and a shared room link (#room=…)
  useEffect(() => {
    setSession(loadSession());
    const saved = store.get(NAME_KEY);
    if (saved) setName(saved);
    const m = window.location.hash.match(/room=([^&]+)/);
    if (m) setJoinId(decodeURIComponent(m[1]));
  }, []);

  // live event stream
  useEffect(() => {
    const conn = connectAirstream({
      onState: setSocket,
      onEvent: (e: AirstreamEvent) => { log(e.type, e.message); refreshRef.current(); },
    });
    return () => conn.close();
  }, [log]);

  // room status polling + heartbeat while in a room
  useEffect(() => {
    if (!session) { setRoom(null); return; }
    let stopped = false;

    const refresh = async () => {
      try {
        const r = await airstream.roomStatus(session.roomId);
        if (!stopped) { setRoom(r); setError(null); }
      } catch (e) {
        if (!stopped) setError(errText(e));
      }
    };
    refreshRef.current = () => { void refresh(); };

    const beat = async () => {
      try { await airstream.heartbeat(session.roomId, session.deviceId); }
      catch (e) { if (!stopped) log("local.heartbeat", `Heartbeat failed: ${errText(e)}`); }
    };

    void refresh();
    void beat();
    const poll = setInterval(() => { if (!document.hidden) void refresh(); }, STATUS_POLL_MS);
    const hb = setInterval(() => { void beat(); }, HEARTBEAT_INTERVAL_MS);
    return () => {
      stopped = true;
      refreshRef.current = () => {};
      clearInterval(poll);
      clearInterval(hb);
    };
  }, [session, log]);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try { await fn(); } catch (e) { setError(errText(e)); } finally { setBusy(null); }
  };

  const enter = (s: Session) => {
    store.set(SESSION_KEY, JSON.stringify(s));
    store.set(NAME_KEY, s.name);
    setSession(s);
  };

  const cleanName = name.trim() || "My Browser";

  const createRoom = () => run("create", async () => {
    const deviceId = `master_${Date.now()}`;
    const r = await airstream.createRoom(deviceId, cleanName);
    log("local.room", `Room created: ${r.roomId}`);
    enter({ roomId: r.roomId, deviceId, role: "master", name: cleanName });
  });

  const joinRoom = () => run("join", async () => {
    const roomId = joinId.trim();
    if (!roomId) throw new Error("Enter a room id to join");
    const deviceId = `slave_${Date.now()}`;
    const r = await airstream.joinRoom(roomId, deviceId, cleanName);
    log("local.room", `Joined ${r.roomId} — detected: ${r.capabilities.tools.join(", ") || "no tools"}`);
    enter({ roomId: r.roomId, deviceId, role: "slave", name: cleanName });
  });

  const leave = () => {
    store.del(SESSION_KEY);
    setSession(null);
    setRoom(null);
    setError(null);
  };

  const action = (label: string, fn: (roomId: string) => Promise<string>) => () =>
    run(label, async () => {
      if (!session) return;
      log(`local.${label}`, await fn(session.roomId));
      refreshRef.current();
    });

  const distribute = action("distribute", async (id) => {
    const r = await airstream.distribute(id);
    return `Distributed ${r.tasksDistributed} task(s), ${r.tasksFailed} unassigned`;
  });
  const collect = action("collect", async (id) => {
    const r = await airstream.collect(id);
    return `Collected ${r.taskCount} task(s) → ${r.filesIntegrated} files integrated (${r.verifyStatus})`;
  });
  const demo = action("demo", async (id) => {
    const r = await airstream.demo(id);
    return `Demo ${r.success ? "succeeded" : "failed"} — ${r.projectType}, exit ${r.exitCode}, ${r.runtime}ms`;
  });

  const copyLink = async () => {
    if (!session) return;
    const link = `${window.location.origin}/airstream#room=${encodeURIComponent(session.roomId)}`;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { window.prompt("Copy this link", link); }
  };

  const isMaster = session?.role === "master";
  const progress = room ? pct(room.taskStats.progress) : 0;

  return (
    <div className="min-h-screen bg-crew-bg text-crew-text font-sans">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-crew-border bg-crew-surface px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/office" className="font-mono text-xs text-crew-text-muted hover:text-crew-text">← OFFICE</Link>
          <h1 className="font-display text-xl font-semibold">Airstream</h1>
          <span className="rounded border border-crew-border px-2 py-0.5 font-mono text-[11px] text-crew-text-secondary">
            {PROJECT_ID}
          </span>
        </div>
        <span className="flex items-center gap-2 font-mono text-xs text-crew-text-secondary">
          <span className={cn("h-2 w-2 rounded-full",
            socket === "open" ? "bg-crew-success" : socket === "connecting" ? "bg-crew-warning animate-pulse" : "bg-crew-error")} />
          event stream {socket}
        </span>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {error && (
            <div role="alert" className="rounded-lg border border-crew-error/40 bg-crew-error-soft px-4 py-3 text-sm text-crew-error">
              {error}
            </div>
          )}

          {!session ? (
            <section className="rounded-xl border border-crew-border bg-crew-card p-6">
              <h2 className="mb-1 text-lg font-semibold">Start or join a room</h2>
              <p className="mb-5 text-sm text-crew-text-secondary">
                The master device creates a room and shares its id. Other devices join with that id and
                their capabilities are detected automatically.
              </p>

              <label className="mb-4 block text-xs text-crew-text-muted">
                This device&apos;s name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  className="mt-1 w-full rounded-md border border-crew-border bg-crew-surface px-3 py-2 text-sm text-crew-text outline-none focus:border-crew-border-strong"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-crew-border bg-crew-surface p-4">
                  <h3 className="mb-2 text-sm font-medium">Master</h3>
                  <button
                    onClick={createRoom}
                    disabled={busy !== null}
                    className="w-full rounded-md bg-crew-primary px-4 py-2 text-sm font-medium text-white hover:bg-crew-primary-hover disabled:opacity-50"
                  >
                    {busy === "create" ? "Creating…" : "Create room"}
                  </button>
                </div>
                <div className="rounded-lg border border-crew-border bg-crew-surface p-4">
                  <h3 className="mb-2 text-sm font-medium">Slave</h3>
                  <input
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    placeholder="room_…"
                    aria-label="Room id"
                    className="mb-2 w-full rounded-md border border-crew-border bg-crew-card px-3 py-2 font-mono text-xs text-crew-text outline-none focus:border-crew-border-strong"
                  />
                  <button
                    onClick={joinRoom}
                    disabled={busy !== null || !joinId.trim()}
                    className="w-full rounded-md border border-crew-border-strong px-4 py-2 text-sm font-medium hover:bg-crew-hover disabled:opacity-50"
                  >
                    {busy === "join" ? "Joining…" : "Join room"}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-xl border border-crew-border bg-crew-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-crew-text-muted">
                      {isMaster ? "Master" : "Slave"} · {session.name}
                    </div>
                    <div className="break-all font-mono text-sm">{session.roomId}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={copyLink} className="rounded-md border border-crew-border-strong px-3 py-1.5 text-xs hover:bg-crew-hover">
                      {copied ? "Copied" : "Copy invite link"}
                    </button>
                    <button onClick={leave} className="rounded-md border border-crew-border-strong px-3 py-1.5 text-xs text-crew-error hover:bg-crew-hover">
                      Leave
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Stat label="Room" value={room?.status ?? "…"} />
                  <Stat label="Devices online" value={room ? `${room.deviceStats.online}/${room.deviceStats.total}` : "…"} />
                  <Stat label="Tasks done" value={room ? `${room.taskStats.committed}/${room.taskStats.total}` : "…"} />
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between font-mono text-[11px] text-crew-text-muted">
                    <span>progress</span><span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-crew-surface" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-crew-success transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  {room && (
                    <div className="mt-2 flex gap-4 font-mono text-[11px] text-crew-text-muted">
                      <span>ready {room.taskStats.ready}</span>
                      <span>leased {room.taskStats.leased}</span>
                      <span>failed {room.taskStats.failed}</span>
                    </div>
                  )}
                </div>

                {isMaster ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <ActionButton onClick={distribute} busy={busy === "distribute"} disabled={busy !== null}>Distribute tasks</ActionButton>
                    <ActionButton onClick={collect} busy={busy === "collect"} disabled={busy !== null}>Collect code</ActionButton>
                    <ActionButton onClick={demo} busy={busy === "demo"} disabled={busy !== null}>Run demo</ActionButton>
                  </div>
                ) : (
                  <p className="mt-5 text-xs text-crew-text-muted">
                    This device is sending heartbeats every {HEARTBEAT_INTERVAL_MS / 1000}s. Only the master runs distribute, collect and demo.
                  </p>
                )}

                {room?.demoStatus && (
                  <p className="mt-4 rounded-md bg-crew-surface px-3 py-2 font-mono text-xs text-crew-text-secondary">
                    last demo: {room.demoStatus.projectType} · exit {room.demoStatus.exitCode} · {room.demoStatus.runtime}ms
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-crew-border bg-crew-card p-6">
                <h2 className="mb-3 text-sm font-semibold">Devices</h2>
                {room && room.deviceStats.devices.length > 0 ? (
                  <ul className="divide-y divide-crew-border">
                    {room.deviceStats.devices.map((d) => (
                      <li key={d.deviceId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={cn("h-2 w-2 rounded-full", d.status === "online" ? "bg-crew-success" : "bg-crew-error")} />
                            <span className="truncate">{d.name}</span>
                            {d.isMaster && <span className="rounded bg-crew-purple-soft px-1.5 py-0.5 font-mono text-[10px] text-crew-purple">MASTER</span>}
                            {d.deviceId === session.deviceId && <span className="font-mono text-[10px] text-crew-text-muted">(this device)</span>}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-[11px] text-crew-text-muted">{d.deviceId}</div>
                        </div>
                        <div className="max-w-full font-mono text-[11px] text-crew-text-secondary">
                          {d.capabilities
                            ? `${d.capabilities.platform ?? "?"} · ${d.capabilities.cpuCount ?? "?"} cpu · ${d.capabilities.tools.join(", ") || "no tools"}`
                            : "capabilities pending"}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-crew-text-muted">No devices yet.</p>
                )}
              </section>
            </>
          )}
        </div>

        <aside className="rounded-xl border border-crew-border bg-crew-card lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)] lg:self-start">
          <div className="border-b border-crew-border px-4 py-3 text-sm font-semibold">Live events</div>
          <ul className="max-h-[60vh] overflow-y-auto px-4 py-2 font-mono text-[11px] lg:max-h-[calc(100vh-11rem)]" aria-live="polite">
            {feed.length === 0 && <li className="py-3 text-crew-text-muted">Waiting for events…</li>}
            {feed.map((f) => (
              <li key={f.id} className="flex gap-2 border-b border-crew-border/50 py-1.5 last:border-0">
                <span className="shrink-0 text-crew-text-muted">{clock(f.ts)}</span>
                <span className={cn("break-words", tone(f.type))}>{f.message}</span>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-crew-surface px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-crew-text-muted">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function ActionButton({ onClick, busy, disabled, children }: {
  onClick: () => void; busy: boolean; disabled: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-crew-border-strong px-4 py-2 text-sm font-medium hover:bg-crew-hover disabled:opacity-50"
    >
      {busy ? "Working…" : children}
    </button>
  );
}
