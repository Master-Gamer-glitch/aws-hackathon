"use client";

// Pick a room: the real replacement for the "select a workspace" mock. A room is the unit of work
// (devices + a plan + the code they build). This lists the rooms this browser knows about with
// their live state, creates a new one, or opens one by id.

import { useCallback, useEffect, useState } from "react";
import { airstream, ApiError, type RoomStatus } from "@/lib/airstream/api";
import { PROJECT_ID } from "@/lib/airstream/config";
import { forgetRoom, loadRooms, saveDeviceName, saveRoom, savedDeviceName, type SavedRoom } from "@/lib/airstream/rooms";
import { cn } from "@/lib/utils";

type Live = { status: RoomStatus } | { error: "expired" | "unreachable" };

const POLL_MS = 5_000;
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function RoomPicker({ onOpen, notice }: { onOpen: (roomId: string) => void; notice?: string | null }) {
  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const [live, setLive] = useState<Record<string, Live>>({});
  const [name, setName] = useState("My Browser");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState<"create" | "open" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setRooms(loadRooms()); setName(savedDeviceName()); }, []);

  // live state of every saved room, refreshed while the page is open
  useEffect(() => {
    if (rooms.length === 0) return;
    let stopped = false;
    const read = async () => {
      const results = await Promise.all(rooms.map(async (r): Promise<[string, Live]> => {
        try { return [r.roomId, { status: await airstream.roomStatus(r.roomId) }]; }
        catch (e) { return [r.roomId, { error: e instanceof ApiError && e.status === 404 ? "expired" : "unreachable" }]; }
      }));
      if (!stopped) setLive(Object.fromEntries(results));
    };
    void read();
    const t = setInterval(() => { if (!document.hidden) void read(); }, POLL_MS);
    return () => { stopped = true; clearInterval(t); };
  }, [rooms]);

  const open = useCallback((roomId: string, role: SavedRoom["role"], deviceName: string) => {
    saveRoom({ roomId, role, name: deviceName });
    onOpen(roomId);
  }, [onOpen]);

  const create = async () => {
    setBusy("create"); setError(null);
    const deviceName = name.trim() || "My Browser";
    try {
      const deviceId = `master_${Date.now()}`;
      const r = await airstream.createRoom(deviceId, deviceName);
      saveDeviceName(deviceName);
      // the /airstream console picks this up, so both screens are looking at the same room
      try { window.localStorage.setItem("airstream.session.v1", JSON.stringify({ roomId: r.roomId, deviceId, role: "master", name: deviceName })); } catch { /* ignore */ }
      open(r.roomId, "master", deviceName);
    } catch (e) { setError(errText(e)); } finally { setBusy(null); }
  };

  const openById = async () => {
    const id = joinId.trim();
    if (!id) return;
    setBusy("open"); setError(null);
    try {
      await airstream.roomStatus(id); // 404 when it does not exist
      open(id, "watch", name.trim() || "My Browser");
    } catch (e) { setError(e instanceof ApiError && e.status === 404 ? "No room with that id. Rooms expire after 24 hours." : errText(e)); }
    finally { setBusy(null); }
  };

  const forget = (id: string) => { forgetRoom(id); setRooms(loadRooms()); };

  return (
    <div className="w-full max-w-xl space-y-6">
      {notice && <div role="status" className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{notice}</div>}
      {error && <div role="alert" className="rounded-lg border border-crew-error/40 bg-crew-error-soft px-4 py-3 text-sm text-crew-error">{error}</div>}

      <section className="rounded-xl border border-crew-border bg-crew-card p-5">
        <h2 className="text-sm font-semibold">Create a room</h2>
        <p className="mb-4 mt-1 text-xs text-crew-text-secondary">
          A room is where devices and their tasks meet. You become its master; other machines join it by running a worker.
        </p>
        <div className="flex gap-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="This device's name" placeholder="This device's name"
            className="min-w-0 flex-1 rounded-md border border-crew-border bg-crew-surface px-3 py-2 text-sm outline-none focus:border-crew-border-strong"
          />
          <button onClick={create} disabled={busy !== null}
            className="shrink-0 rounded-md bg-crew-primary px-4 py-2 text-sm font-medium text-white hover:bg-crew-primary-hover disabled:opacity-50">
            {busy === "create" ? "Creating…" : "Create room"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-crew-border bg-crew-card p-5">
        <h2 className="text-sm font-semibold">Open a room by id</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={joinId} onChange={(e) => setJoinId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && openById()}
            aria-label="Room id" placeholder="room_…"
            className="min-w-0 flex-1 rounded-md border border-crew-border bg-crew-surface px-3 py-2 font-mono text-xs outline-none focus:border-crew-border-strong"
          />
          <button onClick={openById} disabled={busy !== null || !joinId.trim()}
            className="shrink-0 rounded-md border border-crew-border-strong px-4 py-2 text-sm font-medium hover:bg-crew-hover disabled:opacity-50">
            {busy === "open" ? "Checking…" : "Open"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-crew-text-muted">
          <span>Your rooms</span><span className="font-mono normal-case tracking-normal">project {PROJECT_ID}</span>
        </h2>
        {rooms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-crew-border px-4 py-6 text-center text-sm text-crew-text-muted">
            No rooms yet. Create one above and it will show up here with its live state.
          </p>
        ) : (
          <ul className="space-y-2">
            {rooms.map((r) => {
              const l = live[r.roomId];
              const status = l && "status" in l ? l.status : null;
              const expired = l && "error" in l && l.error === "expired";
              return (
                <li key={r.roomId} className="flex items-center gap-3 rounded-xl border border-crew-border bg-crew-card px-4 py-3">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full",
                    status ? "bg-emerald-400" : expired ? "bg-crew-error" : "animate-pulse bg-crew-text-muted")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate font-mono text-xs">{r.roomId}</span>
                      <span className="rounded bg-crew-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-crew-text-muted">{r.role}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-crew-text-muted">
                      {status
                        ? `${status.status} · devices ${status.deviceStats.online}/${status.deviceStats.total} · tasks ${status.taskStats.committed}/${status.taskStats.total}${status.outcome ? ` · ${status.outcome.slice(0, 40)}` : ""}`
                        : expired ? "expired (rooms last 24 hours)" : l ? "backend unreachable" : "checking…"}
                    </div>
                  </div>
                  {!expired && (
                    <button onClick={() => open(r.roomId, r.role, r.name)}
                      className="rounded-md bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500">Open</button>
                  )}
                  <button onClick={() => forget(r.roomId)} aria-label={`Forget ${r.roomId}`} title="Forget this room"
                    className="rounded px-1.5 py-1 text-xs text-crew-text-muted hover:text-crew-error">✕</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
