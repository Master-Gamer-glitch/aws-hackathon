"use client";

// The real office. The floor, the roster, the task boards, the device strip and every panel show
// what is actually happening in one backend room: its devices, tasks and events, updated live.
// Nothing on this screen is simulated. (The simulated office is the "See how it works" tab.)

import { useCallback, useEffect, useRef, useState } from "react";
import { OfficeFloor } from "@office/scene/office/OfficeFloor";
import { useStore } from "@office/store/store";
import { startLiveRuntime } from "@office/runtime";
import { applyLiveTasks, beginLiveLedger, endLiveLedger } from "@office/bridge/liveLedger";
import { buildRoster, diffSnapshots, sameRoster, type Override, type Snapshot } from "@office/bridge/liveRoster";
import { RoomPicker } from "@/components/airstream/RoomPicker";
import type { AirstreamEvent } from "@/lib/airstream/socket";
import { clearLastRoom, lastRoomId } from "@/lib/airstream/rooms";
import { useRoom } from "@/lib/airstream/useRoom";
import { DevicesStrip, Header, RightPanel, Roster, type PanelTab } from "./panels";

const clock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false });

export default function LiveOffice() {
  const [roomId, setRoomId] = useState<string | null | undefined>(undefined); // undefined = still reading the URL
  const [notice, setNotice] = useState<string | null>(null);

  // Live mode owns the store's roster and the task ledger for as long as this is mounted.
  useEffect(() => {
    startLiveRuntime();
    beginLiveLedger();
    useStore.getState().enterLiveRoster([]);
    return () => { endLiveLedger(); useStore.getState().leaveLiveRoster(); };
  }, []);

  useEffect(() => { setRoomId(new URLSearchParams(window.location.search).get("room") || lastRoomId() || null); }, []);

  const open = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("room", id); else url.searchParams.delete("room");
    window.history.replaceState(null, "", url);
    if (!id) clearLastRoom();
    setNotice(null);
    setRoomId(id);
  }, []);

  if (roomId === undefined) return <div className="h-screen w-screen bg-crew-bg" />;

  if (!roomId) {
    return (
      <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-6 overflow-y-auto bg-crew-bg px-4 py-16 text-crew-text">
        <div className="text-center">
          <img src="/ultron-logo.png" alt="Ultron" className="mx-auto mb-3 h-8 w-auto" />
          <h1 className="font-display text-2xl font-semibold">Pick a room to watch</h1>
          <p className="mt-1 text-sm text-crew-text-secondary">Everything on the next screen is live: real devices, real tasks, real events.</p>
        </div>
        <RoomPicker onOpen={open} notice={notice} />
      </div>
    );
  }

  return (
    <RoomView
      key={roomId}
      roomId={roomId}
      onChangeRoom={() => open(null)}
      onGone={() => { open(null); setNotice(`Room ${roomId} does not exist any more. Rooms expire 24 hours after they are created.`); }}
    />
  );
}

function RoomView({ roomId, onChangeRoom, onGone }: { roomId: string; onChangeRoom: () => void; onGone: () => void }) {
  const [tab, setTab] = useState<PanelTab>("room");

  const overrides = useRef<Record<string, Override>>({});
  const prevSnap = useRef<Snapshot | null>(null);
  const masterId = useRef<string | null>(null);
  const latest = useRef<{ room: ReturnType<typeof useRoom>["room"]; tasks: ReturnType<typeof useRoom>["tasks"] }>({ room: null, tasks: [] });

  // Push the current room into the floor: characters, their state, per-device lines, task boards.
  const sync = useCallback((snapshotChanged: boolean) => {
    const { room, tasks } = latest.current;
    if (!room) return;
    const now = Date.now();
    const st = useStore.getState();
    masterId.current = room.deviceStats.devices.find((d) => d.isMaster)?.deviceId ?? null;

    if (snapshotChanged) {
      const snap: Snapshot = { devices: room.deviceStats.devices, tasks };
      for (const l of diffSnapshots(prevSnap.current, snap, masterId.current)) {
        st.pushFeed(l.deviceId, `${clock(now)} ${l.line}`);
        if (l.finished) overrides.current[l.deviceId] = { status: "success", action: "task complete", until: now + 5000 };
      }
      prevSnap.current = snap;
    }

    const next = buildRoster(room, tasks, st.agents, overrides.current, now);
    if (!sameRoster(st.agents, next)) st.setLiveAgents(next);
    if (snapshotChanged) applyLiveTasks(tasks); // after the roster, so each card finds its device
  }, []);

  // The master is the one running collect and demo, so those room events are its activity.
  const onEvent = useCallback((e: AirstreamEvent) => {
    const master = masterId.current;
    if (!master) return;
    const now = Date.now();
    const st = useStore.getState();
    if (e.type === "code.collecting") overrides.current[master] = { status: "working", action: "collecting code from the devices", station: "shelf", until: now + 20_000 };
    else if (e.type === "demo.starting") overrides.current[master] = { status: "working", action: "running the demo", station: "terminal", carrying: "Bash", until: now + 40_000 };
    else if (/^(code\.collected|demo\.completed|demo\.failed)$/.test(e.type)) overrides.current[master] = { status: "success", action: e.type === "demo.failed" ? "demo failed" : "done", until: now + 4000 };
    else return;
    st.pushFeed(master, `${clock(now)} ${e.message}`);
    sync(false);
  }, [sync]);

  const watch = useRoom(roomId, onEvent);

  useEffect(() => {
    latest.current = { room: watch.room, tasks: watch.tasks };
    sync(true);
  }, [watch.room, watch.tasks, sync]);

  // expire the short "task complete" flashes even when nothing new arrives
  useEffect(() => { const t = setInterval(() => sync(false), 1000); return () => clearInterval(t); }, [sync]);

  useEffect(() => { if (watch.notFound) onGone(); }, [watch.notFound, onGone]);

  // clicking a wall board in the scene opens the matching tab; clicking a character shows that device
  const ccTabRequest = useStore((s) => s.ccTabRequest);
  useEffect(() => {
    if (!ccTabRequest) return;
    if (ccTabRequest.tab === "tasks") setTab("tasks");
    else if (ccTabRequest.tab === "activity") setTab("events");
  }, [ccTabRequest]);
  const selectedId = useStore((s) => s.selectedId);
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    if (prevSelected.current !== null && selectedId !== prevSelected.current) setTab("device");
    prevSelected.current = selectedId;
  }, [selectedId]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-crew-bg font-sans text-crew-text">
      <Header roomId={roomId} watch={watch} onChangeRoom={onChangeRoom} />
      <div className="flex min-h-0 flex-1">
        <Roster room={watch.room} />
        <main className="relative flex min-w-0 flex-1 items-center justify-center bg-[#0D1015] p-3">
          <div className="relative h-full max-h-[900px] w-full max-w-[1280px] overflow-hidden rounded-lg border border-crew-border bg-[#0A0D11]">
            <OfficeFloor />
          </div>
          {!watch.room && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0D1015]/70">
              <span className="rounded-md border border-crew-border bg-crew-surface px-4 py-2 font-mono text-xs text-slate-300">
                {watch.error ? `Cannot reach the room: ${watch.error}` : "Connecting to the room…"}
              </span>
            </div>
          )}
        </main>
        <RightPanel roomId={roomId} watch={watch} tab={tab} setTab={setTab} />
      </div>
      <DevicesStrip room={watch.room} roomId={roomId} />
    </div>
  );
}
