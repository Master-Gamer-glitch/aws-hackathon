// Type-only slice of the source project's agentProvider.ts.
//
// The original module also carries the Electron host's CLI presets (spawn flags,
// model catalogues, slash-command groups). The live office only needs the
// provider identifier union for typing `Agent.provider`, so only that is kept.

export type AgentProvider =
  | 'claude'
  | 'codex'
  | 'grok'
  | 'kimi'
  | 'gemini'
  | 'antigravity'
  | 'qwen'
  | 'opencode'
  | 'crush'
  | 'pi'
  | 'copilot'
  | 'cursor'
  | 'custom';
