// Synthetic event stream so the avatars actually move while the CrewDesk backend
// is not connected. This is the swap point for real events: replace the body of
// `stepAgent` with updates arriving over WebSocket/SSE (Step Functions, SQS,
// AgentCore) — the floor reacts to `updateAgent` patches, nothing else.
//
// Each agent works in the style of its role (which tools it reaches for, and where
// on the floor it needs to go to use them), and a station trip is given time to
// finish walking before the agent is moved on (no yo-yo-ing across the office).

import { useStore, type Agent, type StationKind, type ToolKind } from './store';

interface ToolSample {
  tool: ToolKind;
  /** where on the floor this work happens ('desk' = stay at the home workstation) */
  station: StationKind;
  what: string;            // short — used as the action text
  lines: string[];         // terminal stream output
  thought: string;         // first-person assistant text, streamed in the sidebar
}

const bullet = (tool: string, rest: string) => `\x1b[36m● ${tool}\x1b[0m ${rest}`;

const S = {
  spec: { tool: 'Read', station: 'shelf', what: 'reading the API spec',
    lines: [bullet('Read', 'docs/api-spec.md'), '   read 412 lines.'],
    thought: 'Pulling up the spec so I can confirm the state machine before touching the implementation.' },
  edit: { tool: 'Edit', station: 'desk', what: 'editing auth middleware',
    lines: [bullet('Edit', 'src/middleware/auth.ts'), '   +14 / -3'],
    thought: 'Tightening the token validation — the expiry check was off by one.' },
  editAt: { tool: 'Edit', station: 'terminal', what: 'pairing on a refactor',
    lines: [bullet('Edit', 'src/orchestrator/dag.ts'), '   +32 / -11'],
    thought: 'Moving to the spare workstation to refactor the DAG planner without blocking my desk.' },
  tests: { tool: 'Bash', station: 'terminal', what: 'running the test suite',
    lines: [bullet('Bash', 'npm test'), '   ✓ 24 passed'],
    thought: 'Running the suite on the build workstation to make sure nothing regressed.' },
  grep: { tool: 'Grep', station: 'desk', what: 'searching call sites',
    lines: [bullet('Grep', "'verifyToken'"), '   9 matches in 4 files'],
    thought: 'Finding every caller before I change the signature.' },
  board: { tool: 'TodoWrite', station: 'board', what: 'syncing in the meeting room',
    lines: [bullet('TodoWrite', '4 items')],
    thought: 'Walking the team through the plan at the board so everyone knows what is next.' },
  plan: { tool: 'TodoWrite', station: 'board', what: 'planning the sprint',
    lines: [bullet('TodoWrite', '6 items')],
    thought: 'Splitting the remaining work into six discrete tasks and assigning owners.' },
  racks: { tool: 'MCP', station: 'mcp', what: 'checking cluster health',
    lines: [bullet('MCP', 'infra.health()'), '   all 8 nodes healthy'],
    thought: 'Checking the racks before I sign off — nothing red.' },
  sandbox: { tool: 'MCP', station: 'mcp', what: 'checking sandbox health',
    lines: [bullet('MCP', 'sandbox.audit()'), '   3 microVMs, 0 policy violations'],
    thought: 'Auditing the sandbox boundaries on the infrastructure racks.' },
  web: { tool: 'WebSearch', station: 'web', what: 'searching the web',
    lines: [bullet('WebSearch', 'opensearch hybrid retrieval'), '   10 results'],
    thought: 'Looking for the current best practice on hybrid retrieval.' },
  fetch: { tool: 'WebFetch', station: 'web', what: 'fetching reference docs',
    lines: [bullet('WebFetch', 'https://docs.example.com/hooks'), '   ok 200 (1.2kb)'],
    thought: 'Grabbing the docs to double-check the payload shape.' },
  analytics: { tool: 'WebFetch', station: 'web', what: 'checking launch analytics',
    lines: [bullet('WebFetch', 'analytics/launch'), '   ok 200 (3.4kb)'],
    thought: 'Pulling the launch funnel numbers for the announcement.' },
  glob: { tool: 'Glob', station: 'shelf', what: 'indexing new documents',
    lines: [bullet('Glob', 'knowledge/**/*.md'), '   23 matches'],
    thought: 'Enumerating the new documents so I can embed them into the index.' },
  tokens: { tool: 'Read', station: 'shelf', what: 'reviewing design tokens',
    lines: [bullet('Read', 'src/design/tokens.ts'), '   read 188 lines.'],
    thought: 'Checking the cream palette tokens for contrast before I polish the screens.' },
  cedar: { tool: 'Read', station: 'shelf', what: 'auditing Cedar policies',
    lines: [bullet('Read', 'policies/agents.cedar'), '   read 96 lines.'],
    thought: 'Reading the policy set line by line for over-broad permissions.' },
  changelog: { tool: 'Write', station: 'desk', what: 'drafting the changelog',
    lines: [bullet('Write', 'CHANGELOG.md'), '   +48 lines'],
    thought: 'Drafting release notes from the merged pull requests.' },
  polish: { tool: 'Edit', station: 'desk', what: 'polishing the command center',
    lines: [bullet('Edit', 'src/app/office/page.tsx'), '   +9 / -2'],
    thought: 'Nudging spacing and contrast on the command center panel.' },
  review: { tool: 'Bash', station: 'desk', what: 'running policy checks',
    lines: [bullet('Bash', 'npm run audit'), '   ✓ 0 violations'],
    thought: 'Running the audit script against the latest branch.' },
} satisfies Record<string, ToolSample>;

const SAMPLES_BY_AGENT: Record<string, ToolSample[]> = {
  lead: [S.plan, S.plan, S.racks, S.spec, S.board],
  coder: [S.edit, S.edit, S.tests, S.editAt, S.grep, S.spec, S.board],
  design: [S.polish, S.polish, S.tokens, S.fetch, S.board, S.editAt],
  qa: [S.review, S.tests, S.cedar, S.sandbox, S.board],
  research: [S.web, S.glob, S.glob, S.fetch, S.racks, S.spec],
  marketing: [S.changelog, S.changelog, S.analytics, S.board, S.spec],
};
const DEFAULT_SAMPLES: ToolSample[] = [S.spec, S.edit, S.tests, S.fetch, S.glob, S.board];

const samplesFor = (agent: Agent): ToolSample[] => SAMPLES_BY_AGENT[agent.id] ?? DEFAULT_SAMPLES;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ── pacing ────────────────────────────────────────────────────────────────────
const TICK_MS = 1800;
/** How long an agent holds one state before the loop may move it on. A station trip
 *  needs enough time to walk across the office (48 px/s ≈ 3 tiles/s). */
const HOLD_DESK_MS = 2500;
const HOLD_TRIP_MS = 11000;

/** The sample an agent is currently executing (chosen when it leaves for a station). */
const current = new Map<string, ToolSample>();
/** When the agent last changed state, keyed by a signature of that state. */
const since = new Map<string, { sig: string; t: number }>();

function heldFor(agent: Agent): number {
  const sig = `${agent.status}|${agent.action}|${agent.currentStation ?? ''}`;
  const prev = since.get(agent.id);
  if (!prev || prev.sig !== sig) { since.set(agent.id, { sig, t: Date.now() }); return 0; }
  return Date.now() - prev.t;
}

function stepAgent(agent: Agent) {
  const { updateAgent, pushFeed } = useStore.getState();
  const held = heldFor(agent);

  if (agent.status === 'blocked') return;       // waits for the human (ASK ME / auto mode)

  if (agent.status === 'idle') {
    // Maybe start a new task
    if (held >= 2500 && Math.random() < 0.4) {
      const sample = pick(samplesFor(agent));
      current.set(agent.id, sample);
      const away = sample.station !== 'desk';
      updateAgent(agent.id, {
        status: 'thinking',
        action: away ? `heading to ${sample.station}` : 'starting up',
        currentStation: sample.station,
        progress: 1,
      });
    }
    return;
  }

  if (agent.status === 'thinking') {
    const sample = current.get(agent.id);
    const away = agent.currentStation && agent.currentStation !== 'desk';
    // "heading back to desk" resolves in the completion pass below; a trip needs time to arrive.
    if (!sample) {
      // No job in flight (e.g. the loop restarted mid-trip): settle rather than hang in "thinking".
      if (agent.action !== 'heading back to desk' && held >= HOLD_DESK_MS) {
        updateAgent(agent.id, { status: 'idle', action: 'awaiting', currentStation: 'desk', carrying: undefined });
      }
      return;
    }
    if (held < (away ? HOLD_TRIP_MS : HOLD_DESK_MS)) return;
    updateAgent(agent.id, {
      status: 'working',
      action: sample.what,
      carrying: sample.tool,
      progress: Math.min(agent.progress + 1, 8),
      recentAssistantText: sample.thought,
      recentTextTs: Date.now(),
    });
    sample.lines.forEach((l) => pushFeed(agent.id, l));
    return;
  }

  if (agent.status === 'working') {
    const away = agent.currentStation && agent.currentStation !== 'desk';
    if (held < (away ? HOLD_TRIP_MS : 6000)) return;
    if (Math.random() < 0.5) {
      // Done here — head home (the desk trip is a 'thinking' stretch that settles to idle in the pass below)
      current.delete(agent.id);
      updateAgent(agent.id, {
        status: 'thinking',
        action: 'heading back to desk',
        currentStation: 'desk',
        carrying: undefined,
        progress: Math.min(agent.progress + 1, 8),
      });
    } else {
      // Move straight on to another job
      const sample = pick(samplesFor(agent));
      current.set(agent.id, sample);
      const away2 = sample.station !== 'desk';
      updateAgent(agent.id, {
        status: 'thinking',
        action: away2 ? `heading to ${sample.station}` : 'starting up',
        currentStation: sample.station,
        carrying: undefined,
        progress: Math.min(agent.progress + 1, 8),
      });
    }
    return;
  }
}

const MOCK_ACTS = ['request', 'inform', 'propose', 'query', 'agree'] as const;

/** Occasionally fire a synthetic agent-to-agent message so the office floor's
 *  envelope-handoff animation is visible in demo mode (no live hive routing
 *  happens without real agents). The scene listens for this event and
 *  flies an envelope between the two avatars; see OfficeFloor's demo path. */
function maybeFlyMessage(mockIds: string[]): void {
  if (mockIds.length < 2 || Math.random() >= 0.45) return;
  const from = mockIds[Math.floor(Math.random() * mockIds.length)];
  let to = from;
  for (let i = 0; i < 6 && to === from; i++) {
    to = mockIds[Math.floor(Math.random() * mockIds.length)];
  }
  if (to === from) return;
  const act = MOCK_ACTS[Math.floor(Math.random() * MOCK_ACTS.length)];
  window.dispatchEvent(new CustomEvent('cth:demo-handoff', { detail: { from, to, act } }));
}

let interval: number | null = null;

export function startMockLoop() {
  if (interval !== null) return;
  interval = window.setInterval(() => {
    const { agents } = useStore.getState();
    // Only step mock agents (no ptyId). Real agents are driven by the pty parser.
    for (const a of agents) if (!a.ptyId) stepAgent(a);

    const { agents: a2, updateAgent } = useStore.getState();
    for (const a of a2) {
      if (a.ptyId) continue;
      // Back at the desk after a job (or done): settle into the "awaiting" state for a beat.
      if (a.status === 'thinking' && a.currentStation === 'desk' && a.action === 'heading back to desk'
          && heldFor(a) >= HOLD_DESK_MS + 2500) {
        updateAgent(a.id, {
          status: 'idle',
          action: 'awaiting',
          carrying: undefined,
          recentAssistantText: 'Done with that one. What next?',
          recentTextTs: Date.now(),
        });
      }
    }

    maybeFlyMessage(a2.filter((a) => !a.ptyId).map((a) => a.id));
  }, TICK_MS) as unknown as number;
}

export function stopMockLoop() {
  if (interval !== null) {
    window.clearInterval(interval);
    interval = null;
  }
  current.clear();
  since.clear();
}
