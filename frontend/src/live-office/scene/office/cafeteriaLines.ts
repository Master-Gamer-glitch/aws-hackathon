// Break-room small-talk — CrewDesk edition.
//
// An agent's coffee break is an excuse for a one-liner in character. Two kinds:
//   • solo  — one quip shown above a single agent at a break spot
//   • pair  — a multi-beat exchange between two agents at the same table
//
// Lines are kept short so they fit the ThoughtBubble (≈MAX_WIDTH). Character keys
// match OfficeCharacterName; anyone without bespoke lines falls back to the
// shared pools so the floor never feels empty.
//
// (The original project shipped show-specific quotes here; CrewDesk uses its own
// AI-workforce banter. The exported API is unchanged.)

import type { OfficeCharacterName } from './cast';

/** Where an agent is lingering — picks a contextual line pool. */
export type BreakSpot = 'coffee' | 'vending' | 'snack' | 'table';

const pick = <T,>(arr: readonly T[], seed: number): T =>
  arr[((seed % arr.length) + arr.length) % arr.length];

// ─── solo lines, by spot ─────────────────────────────────────────────────────

const COFFEE: readonly string[] = [
  'first cup of the day. and the fifth.',
  "we're out of beans again",
  'context window: full. mug: empty.',
  'coffee is just a cache for humans',
  'who took my mug?',
  'brewing while the build runs',
];

const VENDING: readonly string[] = [
  'the vending machine has a 429 rate limit',
  'B4… no, B5. always B5.',
  'exact change. no retries.',
  'insert token to continue',
  'it ate my dollar. again.',
];

const SNACK: readonly string[] = [
  'a snack. strictly a batch job.',
  'refuelling — back in 30 seconds',
  'do pretzels count as a dependency?',
  'anything good in the fridge?',
];

const TABLE: readonly string[] = [
  'standup, but sitting down',
  'best ideas happen away from the desk',
  'no meetings that could be a webhook',
  'lunch. then the deploy.',
];

const SPOT_POOL: Record<BreakSpot, readonly string[]> = {
  coffee: COFFEE,
  vending: VENDING,
  snack: SNACK,
  table: TABLE,
};

// Role flavour, keyed by the cast slot each CrewDesk agent is mapped to (see
// store DEFAULT_CREW_AGENTS): lead, engineering, design, review, research, launch.
const BY_CHARACTER: Partial<Record<OfficeCharacterName, readonly string[]>> = {
  michael: ['syncing the whole crew over coffee', 'the DAG is green. probably.', 'delegating… to the espresso machine'],
  jim:     ['merging before the coffee gets cold', 'works on my machine. and yours now.', 'refactor? after the cappuccino.'],
  pam:     ['pixel-nudging my mug 1px left', 'this palette needs more contrast. and cream.', 'sketching on a napkin again'],
  dwight:  ['policy check: is this cup approved?', 'audit trail says you took my mug', 'zero regressions. zero spills.'],
  angela:  ['indexing the break room… 4 chairs, 1 plant', 'sources cited: the coffee machine manual', 'retrieval augmented… caffeination'],
  ryan:    ['drafting the changelog between sips', 'shipping notes go great with espresso', 'launch day snack stash secured'],
};

/** A quip for an agent lingering at `spot`. `seed` keeps the pick stable for a visit. */
export function pickSoloLine(character: OfficeCharacterName, spot: BreakSpot, seed: number): string {
  const own = BY_CHARACTER[character];
  // ~1 in 3 lines is in the agent's own voice; the rest is spot-flavoured.
  if (own && seed % 3 === 0) return pick(own, seed);
  return pick(SPOT_POOL[spot], seed);
}

// ─── two-beat exchanges ──────────────────────────────────────────────────────

/** Alternating beats: even index = the initiator, odd = the table-mate. */
export type Exchange = readonly string[];

const EXCHANGES: readonly Exchange[] = [
  ['did the deploy finish?', 'green across the board.', 'nice. coffee to celebrate?', 'already brewing.'],
  ['quick question about the schema.', 'is it a quick question?', 'it is a schema question.', 'ah. sit down.'],
  ['I found a flaky test.', 'quarantine it.', 'I did. it filed a complaint.', 'that is a lot of personality for a test.'],
  ['who owns the pipeline alert?', 'the on-call agent.', 'that is me.', 'then you have your answer.'],
  ['the design tokens changed.', 'again?', 'only the cream.', 'which is every token.'],
  ['ship it Friday?', 'no.', 'ship it Thursday?', 'better. still no.'],
  ['how is the vector index?', 'fresh. 4k new chunks.', 'any duplicates?', 'a few. I am on it.'],
  ['budget check: how are we?', '$0.42 of $5.00.', 'frugal.', 'we are an efficient crew.'],
];

// Keyed off the SPEAKER so, when the right agent sits down first, they open with
// their signature bit.
const KEYED_EXCHANGES: Partial<Record<OfficeCharacterName, Exchange>> = {
  michael: ['standup in five?', 'we are already standing.', 'then it is a walk-up.'],
  jim:     ['PR is up.', 'is it small?', 'it is… medium. with vibes.'],
  pam:     ['can I show you a mockup?', 'is it pixel-perfect?', 'it is pixel-adjacent.'],
  dwight:  ['permission denied.', 'I did not ask anything yet.', 'still denied.'],
  angela:  ['I read the whole knowledge base.', 'all of it?', 'and cited it.'],
  ryan:    ['launch post is drafted.', 'headline?', 'crew online. work done.'],
};

/** A multi-beat exchange for two agents sharing a table. Beats alternate:
 *  index 0 = `speaker`, 1 = the table-mate, 2 = speaker, … */
export function pickExchange(speaker: OfficeCharacterName, seed: number): Exchange {
  const keyed = KEYED_EXCHANGES[speaker];
  if (keyed && seed % 4 === 0) return keyed;
  return pick(EXCHANGES, seed);
}
