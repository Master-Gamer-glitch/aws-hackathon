'use client';

// Watch one room in real time: its devices and tasks (polled) plus the backend's event stream
// (pushed). A push triggers an immediate re-read, so the screen reacts in about a second and the
// poll only exists as a safety net.

import { useCallback, useEffect, useRef, useState } from 'react';
import { airstream, ApiError, type BackendTask, type RoomStatus } from './api';
import { ROOM_POLL_MS } from './config';
import { tasksForRoom } from './scope';
import { connectAirstream, type AirstreamEvent, type SocketState } from './socket';

export interface FeedItem { id: number; ts: number; type: string; message: string }

const FEED_LIMIT = 200;

export interface RoomWatch {
  room: RoomStatus | null;
  /** this room's tasks only (current plan + project-level) */
  tasks: BackendTask[];
  feed: FeedItem[];
  socket: SocketState;
  error: string | null;
  /** the room does not exist (any more): rooms expire after 24 hours */
  notFound: boolean;
  /** round trip of the last status read, in ms */
  latencyMs: number | null;
  lastSync: number | null;
  refresh: () => void;
  /** add a line to the feed for something this browser did */
  log: (type: string, message: string) => void;
}

export function useRoom(roomId: string | null, onEvent?: (e: AirstreamEvent) => void): RoomWatch {
  const [room, setRoom] = useState<RoomStatus | null>(null);
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [socket, setSocket] = useState<SocketState>('closed');
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);

  const seq = useRef(0);
  const refreshRef = useRef<() => void>(() => {});
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const log = useCallback((type: string, message: string) => {
    setFeed((f) => [{ id: ++seq.current, ts: Date.now(), type, message }, ...f].slice(0, FEED_LIMIT));
  }, []);

  useEffect(() => {
    setRoom(null); setTasks([]); setFeed([]); setError(null); setNotFound(false); setLatencyMs(null); setLastSync(null);
    if (!roomId) { refreshRef.current = () => {}; return; }

    let stopped = false;
    let inFlight = false;
    let nudge: ReturnType<typeof setTimeout> | null = null;

    const refresh = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      const t0 = performance.now();
      try {
        const [r, all] = await Promise.all([airstream.roomStatus(roomId), airstream.listTasks()]);
        if (stopped) return;
        setLatencyMs(Math.round(performance.now() - t0));
        setRoom(r);
        setTasks(tasksForRoom(all, roomId, r));
        setLastSync(Date.now());
        setError(null);
        setNotFound(false);
      } catch (e) {
        if (stopped) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        inFlight = false;
      }
    };
    refreshRef.current = () => { void refresh(); };

    void refresh();
    const poll = setInterval(() => { if (!document.hidden) void refresh(); }, ROOM_POLL_MS);

    const conn = connectAirstream({
      onState: (s) => { if (!stopped) setSocket(s); },
      onEvent: (e) => {
        log(e.type, e.message);
        onEventRef.current?.(e);
        if (!nudge) nudge = setTimeout(() => { nudge = null; void refresh(); }, 350); // coalesce bursts
      },
    });

    return () => {
      stopped = true;
      refreshRef.current = () => {};
      clearInterval(poll);
      if (nudge) clearTimeout(nudge);
      conn.close();
    };
  }, [roomId, log]);

  const refresh = useCallback(() => refreshRef.current(), []);
  return { room, tasks, feed, socket, error, notFound, latencyMs, lastSync, refresh, log };
}
