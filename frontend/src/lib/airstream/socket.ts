// Reconnecting client for the Airstream event stream (API Gateway WebSocket).
// The backend broadcasts one JSON object per event: { type, projectId, message }.

import { PROJECT_ID, WS_BASE_URL, WS_RECONNECT_MS } from './config';

export interface AirstreamEvent {
  /** e.g. device.joined, device.online, device.offline, task.assigned, tasks.distributed,
   *  task.completed, task.failed, task.redistributed, code.collecting, code.collected,
   *  demo.starting, demo.completed, demo.failed, status.update, room.created */
  type: string;
  projectId?: string;
  message: string;
}

export type SocketState = 'connecting' | 'open' | 'closed';

export interface AirstreamSocket {
  close(): void;
}

interface Handlers {
  onEvent: (e: AirstreamEvent) => void;
  onState?: (s: SocketState) => void;
}

/** Opens the stream and keeps it open (with a fixed-delay retry) until `close()`. */
export function connectAirstream({ onEvent, onState }: Handlers): AirstreamSocket {
  let ws: WebSocket | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const open = () => {
    if (stopped) return;
    onState?.('connecting');
    try {
      ws = new WebSocket(`${WS_BASE_URL}?projectId=${encodeURIComponent(PROJECT_ID)}`);
    } catch {
      schedule();
      return;
    }
    ws.onopen = () => onState?.('open');
    ws.onmessage = (m) => {
      try {
        const data = JSON.parse(typeof m.data === 'string' ? m.data : '');
        if (data && typeof data.type === 'string') {
          onEvent({ type: data.type, projectId: data.projectId, message: String(data.message ?? '') });
        }
      } catch { /* ignore non-JSON frames */ }
    };
    ws.onclose = () => { onState?.('closed'); schedule(); };
    ws.onerror = () => { try { ws?.close(); } catch { /* already closing */ } };
  };

  const schedule = () => {
    if (stopped || retry) return;
    retry = setTimeout(() => { retry = null; open(); }, WS_RECONNECT_MS);
  };

  open();

  return {
    close() {
      stopped = true;
      if (retry) { clearTimeout(retry); retry = null; }
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        try { ws.close(); } catch { /* already closed */ }
        ws = null;
      }
      onState?.('closed');
    },
  };
}
