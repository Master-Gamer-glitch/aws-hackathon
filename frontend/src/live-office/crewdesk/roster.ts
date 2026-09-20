// CrewDesk's crew — the agent roster the live office is seeded with.
//
// This is the AGENT DATA layer: who is on the floor, what they do and how the UI
// presents them. It is deliberately separate from
//   - the OFFICE ENVIRONMENT (scene/office/*: tile map, seats, coffee economy),
//   - CHARACTER STATE (the zustand store's status/action/currentStation, animated
//     by scene/office/Character.ts), and
//   - TASK DATA (bridge/mockLedger.ts).
// Replace CREW_AGENTS / the mock loop with data from the CrewDesk backend
// (WebSocket / SSE / Step Functions / AgentCore events) and the floor follows.

import type { Agent } from '../store/store';

/** Presentation metadata the CrewDesk UI needs on top of the store's Agent. */
export interface CrewMeta {
  id: string;
  /** Short label used on the agent strip. */
  shortName: string;
  /** Role line shown in the command-center header. */
  role: string;
  badge: string;
  badgeColor: string;
  /** Portrait used by the strip / command center (public/characters/*). */
  avatar: string;
  /** What kind of "work" this agent does — drives the human-readable state label. */
  focus: 'coordinating' | 'coding' | 'designing' | 'reviewing' | 'researching' | 'shipping';
  /** Named area of the office this agent's desk belongs to. */
  area: string;
  context: string;
}

export const CREW_META: Record<string, CrewMeta> = {
  lead: {
    id: 'lead', shortName: 'ULTRON', role: 'Supreme Orchestrator & Swarm Commander',
    badge: 'LEAD', badgeColor: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm', avatar: '/ultron-logo.png',
    focus: 'coordinating', area: 'Command Center', context: '56k/1000k (6%)',
  },
  coder: {
    id: 'coder', shortName: 'CODER', role: 'Full-Stack Engineer & AST Refactor',
    badge: 'CODE', badgeColor: 'bg-blue-600 text-white', avatar: '/characters/coder.png',
    focus: 'coding', area: 'Engineering', context: '142k/1000k (14%)',
  },
  design: {
    id: 'design', shortName: 'DESIGN', role: 'UI/UX & Design Tokens',
    badge: 'DESIGN', badgeColor: 'bg-purple-600 text-white', avatar: '/characters/designer.png',
    focus: 'designing', area: 'Design', context: '89k/1000k (9%)',
  },
  qa: {
    id: 'qa', shortName: 'QA', role: 'Cedar Security & Policy Audit',
    badge: 'AUDIT', badgeColor: 'bg-emerald-600 text-white', avatar: '/characters/qa.png',
    focus: 'reviewing', area: 'QA & Review', context: '34k/1000k (3%)',
  },
  research: {
    id: 'research', shortName: 'RAG', role: 'OpenSearch & Knowledge RAG',
    badge: 'INDEX', badgeColor: 'bg-amber-600 text-white', avatar: '/characters/analyst.png',
    focus: 'researching', area: 'Research', context: '71k/1000k (7%)',
  },
  marketing: {
    id: 'marketing', shortName: 'LAUNCH', role: 'Changelog, Docs & Deployment',
    badge: 'SHIP', badgeColor: 'bg-rose-600 text-white', avatar: '/characters/marketing.png',
    focus: 'shipping', area: 'Marketing', context: '12k/1000k (1%)',
  },
};

/** Fallback presentation for agents hired at runtime (the "add agent" flow). */
export function metaFor(agent: Pick<Agent, 'id' | 'name' | 'description'>): CrewMeta {
  const known = CREW_META[agent.id];
  if (known) return known;
  return {
    id: agent.id,
    shortName: agent.name.toUpperCase().slice(0, 6),
    role: agent.description,
    badge: agent.name.toUpperCase().slice(0, 4),
    badgeColor: 'bg-purple-600 text-white',
    avatar: '/characters/coder.png',
    focus: 'coding',
    area: 'Open floor',
    context: '0k/1000k (0%)',
  };
}

// The `character` field picks which procedurally-drawn cast sprite represents the
// agent on the floor (see scene/office/cast.ts). Seats are claimed in order:
// the lead takes the corner Command Center desk, everyone else the open-plan desks.
export const CREW_AGENTS: Agent[] = [
  {
    id: 'lead',
    name: 'Ultron',
    character: 'michael',
    accent: 'lemon',
    description: 'Supreme Orchestrator · Head of Swarm',
    project: 'Ultron Swarm Core',
    tmuxTarget: '0',
    cwd: '/workspace/ultron',
    goal: 'Direct and coordinate the autonomous AI workforce, enforce Cedar boundaries, and synthesize outputs.',
    status: 'working',
    action: 'orchestrating the autonomous agent swarm',
    progress: 18,
    currentStation: 'desk',
    isGod: true,
    model: 'Claude 3.7 Sonnet (Hybrid Reasoning)',
    recentAssistantText: 'Ultron is online. Swarm directives active. Awaiting mission parameters.',
    recentTextTs: Date.now(),
  },
  {
    id: 'coder',
    name: 'Coder',
    character: 'jim',
    accent: 'sky',
    description: 'Full-Stack Engineer \\ Engineering Agent',
    project: 'Frontend & API Systems',
    tmuxTarget: '1',
    cwd: '/workspace/src',
    goal: 'Build core application features',
    status: 'working',
    action: 'editing the reactive office floor',
    carrying: 'Edit',
    progress: 4,
    currentStation: 'shelf',
    recentAssistantText: 'Refining tilemap collision passes and camera tracking.',
    recentTextTs: Date.now(),
  },
  {
    id: 'design',
    name: 'Designer',
    character: 'pam',
    accent: 'peach',
    description: 'UI/UX Designer \\ Design Agent',
    project: 'Design System & Assets',
    tmuxTarget: '2',
    cwd: '/workspace/src/design',
    goal: 'Keep the product on the warm cream design system',
    status: 'thinking',
    action: 'polishing color palette tokens',
    carrying: 'Read',
    progress: 3,
    currentStation: 'board',
    recentAssistantText: 'Tuning contrast ratios across the cream theme tokens.',
    recentTextTs: Date.now(),
  },
  {
    id: 'qa',
    name: 'Reviewer',
    character: 'dwight',
    accent: 'mint',
    description: 'Security & QA Reviewer \\ Review Agent',
    project: 'Quality & Test Suite',
    tmuxTarget: '3',
    cwd: '/workspace/tests',
    goal: 'Zero regressions across builds',
    status: 'working',
    action: 'running the regression test suite',
    carrying: 'Bash',
    progress: 6,
    currentStation: 'terminal',
    recentAssistantText: 'Verifying the sprite lifecycle against Cedar policy.',
    recentTextTs: Date.now(),
  },
  {
    id: 'research',
    name: 'Research',
    character: 'angela',
    accent: 'lilac',
    description: 'Knowledge Researcher \\ RAG Agent',
    project: 'Knowledge Base & Retrieval',
    tmuxTarget: '4',
    cwd: '/workspace/knowledge',
    goal: 'Keep the vector index fresh and cited',
    status: 'idle',
    action: 'indexing new documents',
    progress: 2,
    currentStation: 'desk',
    recentAssistantText: 'Re-embedding the latest docs into the OpenSearch index.',
    recentTextTs: Date.now(),
  },
  {
    id: 'marketing',
    name: 'Launch',
    character: 'ryan',
    accent: 'coral',
    description: 'Launch & Growth \\ Marketing Agent',
    project: 'Growth & Launch Ops',
    tmuxTarget: '5',
    cwd: '/workspace/marketing',
    goal: 'Prepare the launch campaign and docs',
    status: 'idle',
    action: 'reviewing the analytics queue',
    progress: 2,
    currentStation: 'desk',
    recentAssistantText: 'Drafting release notes and onboarding highlights.',
    recentTextTs: Date.now(),
  },
];
