// The HOST BRIDGE — `window.cth`.
//
// The office engine was built for a desktop host that exposes a small IPC surface
// (task ledger, agent registry, telemetry, PTYs…). In the browser that surface is
// provided here. It is the seam where the CrewDesk backend plugs in: point
// `hiveTasks` / `onHiveMessage` / `onTelemetryEvent` at WebSocket/SSE endpoints
// (Step Functions, SQS, AgentCore) and the floor reacts with no scene changes.
//
// Everything is optional-chained by the engine, so unimplemented calls are inert.

import { getLedger } from './mockLedger';

export function installHostBridge(): void {
  if (typeof window === 'undefined') return;
  const existing = (window as any).cth || {};
  (window as any).cth = {
    getConfig: async () => ({
      officeTheme: 'crewdesk',
      tvShowOffices: false,
      freeflowEnabled: false,
      webhookTriggers: [],
    }),
    onConfigChanged: (_cb: unknown) => () => {},
    onCloseRequested: (_cb: unknown) => () => {},
    realtimeHasOpenAiKey: async () => false,
    // TASK DATA — swap for a backend fetch.
    hiveTasks: async () => ({ tasks: getLedger() }),
    hiveRegistry: async () => ({ godId: 'lead', agents: {} }),
    onHiveMessage: (_cb: unknown) => () => {},
    rosterReadSync: () => null,
    harnessHomeSync: () => null,
    rosterWrite: async () => {},
    readClipboard: async () => '',
    writeClipboard: async () => {},
    gitIsRepo: async () => false,
    spawnPty: async () => ({ ok: true, ptyId: 'mock-pty' }),
    killPty: async () => {},
    telemetrySnapshot: async () => null,
    onTelemetryEvent: (_cb: unknown) => () => {},
    onBreakerState: (_cb: unknown) => () => {},
    telemetrySpans: async () => [],
    readBinary: async () => null,
    hiveRenameAgent: async (_id: string, name: string) => ({ ok: true, name }),
    ...existing,
  };
}
