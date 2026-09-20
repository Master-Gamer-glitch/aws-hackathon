// The agent run-state vocabulary shared by the store, the office scene and the UI.
// (Extracted from the source project's PixelBadge.tsx — the badge component itself
// is replaced by CrewDesk's own status chips.)

export type StatusKind =
  | 'idle' | 'thinking' | 'working' | 'waiting' | 'blocked' | 'success' | 'ghost'
  // richer states driven by real events: PreCompact/PostCompact hooks and the
  // circuit breaker respectively.
  | 'compacting' | 'looping'
  // Not an agent state at all — the USER has unsubmitted text on that agent's
  // prompt, which holds its queue. Derived at render, never stored on the agent.
  | 'typing';
