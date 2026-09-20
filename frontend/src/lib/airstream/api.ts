// Typed client for the Airstream REST API. Shapes are taken from the Lambda handlers
// in services/api/handlers (not from the older prose docs, which have drifted).

import { API_BASE_URL, PROJECT_ID } from './config';

// ── Types ────────────────────────────────────────────────────────────────────

/** Task lifecycle states used by the backend task table. */
export type BackendTaskState = 'ready' | 'leased' | 'submitted' | 'verifying' | 'committed' | 'failed';

export interface BackendTask {
  taskId: string;
  state: BackendTaskState;
  leaseOwner: string | null;
  leaseEpoch: number;
  leaseExpiry: number | null;
  attempts: number;
  objective: string | null;
  /** crew role named in the task contract (e.g. "coder"); drives which character the office animates */
  ownerAgent?: string | null;
  budget: { usd?: number } | null;
  resultDeviceId: string | null;
  /** set for tasks planned for a specific room (via /plan); absent for project-level tasks */
  roomId?: string | null;
  planId?: string | null;
  createdAt?: number | null;
  contract?: {
    objective: string;
    expectedOutput: string;
    successCriteria: string[];
    /** paths this task owns */
    files?: string[];
    notes?: string;
  } | null;
}

export interface DeviceCapabilities {
  platform?: string;
  cpuCount?: number;
  memTotalGb?: string | number;
  tools: string[];
  benchScore?: number;
}

export interface RoomDevice {
  deviceId: string;
  name: string;
  status: 'online' | 'offline' | string;
  isMaster: boolean;
  capabilities?: DeviceCapabilities;
  lastHeartbeat?: number;
  offlineSince?: number;
}

export interface RoomStatus {
  roomId: string;
  projectId: string;
  status: string; // waiting | executing | demo_executed | ...
  masterDevice: { deviceId: string; name: string };
  deviceStats: { total: number; online: number; offline: number; devices: RoomDevice[] };
  taskStats: {
    ready: number;
    leased: number;
    committed: number;
    failed: number;
    total: number;
    /** percentage; the backend returns a string like "42.9", or 0 when nothing is done */
    progress: string | number;
  };
  leaseDistribution: Record<string, number>;
  timeline: { createdAt: number; roomAge: number; lastUpdate: number };
  demoStatus: {
    projectType: string;
    command: string;
    exitCode: number | null;
    runtime: number;
    success: boolean;
    timedOut?: boolean;
    outputSize: number;
    outputTail?: string;
  } | null;
  masterDir: string | null;
  /** the current plan for this room, and the outcome it was made for */
  planId?: string | null;
  outcome?: string | null;
}

export interface CreateRoomResult { roomId: string; masterId: string; message: string }
export interface JoinRoomResult { deviceId: string; roomId: string; capabilities: DeviceCapabilities; message: string }
export interface HeartbeatResult {
  deviceId: string;
  timestamp: number;
  onlineDeviceCount: number;
  offlineDeviceCount: number;
  tasksRedistributed: boolean;
}
export interface DistributeResult { roomId: string; tasksDistributed: number; tasksFailed: number; timestamp: number }
export interface CollectConflict { path: string; overwrote: string; by: string }
export interface CollectResult {
  roomId: string;
  /** s3:// location of the merged project, or null when there was nothing to collect */
  masterDir: string | null;
  filesIntegrated: number;
  taskCount: number;
  deviceCount: number;
  /** files two tasks both wrote; the later task won */
  conflicts: CollectConflict[];
  verifyStatus: 'passed' | 'failed' | 'skipped';
  verifyNotes?: string[];
  message: string;
}
export interface DemoResult {
  roomId: string;
  projectType: string;
  command: string;
  exitCode: number | null;
  /** true when the project was still running (e.g. a dev server) and was stopped at the time limit */
  timedOut: boolean;
  runtime: number;
  success: boolean;
  outputLength: number;
  /** tail of the combined stdout/stderr */
  output: string;
  message: string;
}

export interface HeartbeatMetrics { cpuUsage?: number; memUsage?: number; activeTaskCount?: number }

// ── Transport ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError('Backend unreachable — check your network and NEXT_PUBLIC_API_BASE_URL', 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string')
      ? (data as { error: string }).error
      : `${res.status} ${res.statusText}`.trim();
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

const room = (roomId: string) => `/projects/${encodeURIComponent(PROJECT_ID)}/rooms/${encodeURIComponent(roomId)}`;

// ── Endpoints ────────────────────────────────────────────────────────────────

export const airstream = {
  /** GET /projects/{id}/tasks */
  async listTasks(): Promise<BackendTask[]> {
    const data = await request<{ tasks?: BackendTask[] }>(`/projects/${encodeURIComponent(PROJECT_ID)}/tasks`);
    return data.tasks ?? [];
  },

  /** POST /projects/{id}/rooms — the caller becomes the room's master device. */
  createRoom: (deviceId: string, deviceName: string) =>
    post<CreateRoomResult>(`/projects/${encodeURIComponent(PROJECT_ID)}/rooms`, { deviceId, deviceName }),

  /** POST /rooms/{roomId}/devices — join as a slave; capabilities are detected server-side. */
  joinRoom: (roomId: string, deviceId: string, deviceName: string) =>
    post<JoinRoomResult>(`${room(roomId)}/devices`, { deviceId, deviceName }),

  /** POST /rooms/{roomId}/devices/{deviceId}/heartbeat */
  heartbeat: (roomId: string, deviceId: string, metrics: HeartbeatMetrics = {}) =>
    post<HeartbeatResult>(`${room(roomId)}/devices/${encodeURIComponent(deviceId)}/heartbeat`, { status: 'ok', metrics }),

  /** GET /rooms/{roomId} */
  roomStatus: (roomId: string) => request<RoomStatus>(room(roomId)),

  /** POST /rooms/{roomId}/distribute */
  distribute: (roomId: string) => post<DistributeResult>(`${room(roomId)}/distribute`),

  /** POST /rooms/{roomId}/collect */
  collect: (roomId: string) => post<CollectResult>(`${room(roomId)}/collect`),

  /** POST /rooms/{roomId}/demo */
  demo: (roomId: string) => post<DemoResult>(`${room(roomId)}/demo`),
};
