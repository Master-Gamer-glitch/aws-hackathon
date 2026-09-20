// Task contracts and room scoping, shared by the plan endpoint, distribute, collect and status.

import { sanitizePath, ArtifactError } from './artifacts.mjs';

/** A problem with the plan the caller sent (maps to HTTP 400). */
export class ContractError extends Error {
  constructor(message) { super(message); this.name = 'ContractError'; this.statusCode = 400; }
}

export const LIMITS = { maxTasks: 12, maxOutcomeChars: 4000 };

const ACTIONS = new Set(['read_repo', 'write_code', 'test', 'commit', 'publish', 'deploy']);

function text(value, field, max, { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ContractError(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new ContractError(`${field} must be a string`);
  const v = value.trim();
  if (!v && required) throw new ContractError(`${field} is required`);
  if (v.length > max) throw new ContractError(`${field} is too long (max ${max} characters)`);
  return v;
}

function strings(value, field, { max, itemMax, required = false }) {
  if (value === undefined || value === null) {
    if (required) throw new ContractError(`${field} is required`);
    return undefined;
  }
  if (!Array.isArray(value)) throw new ContractError(`${field} must be an array`);
  if (required && value.length === 0) throw new ContractError(`${field} must not be empty`);
  if (value.length > max) throw new ContractError(`${field} has too many entries (max ${max})`);
  return value.map((v, i) => text(v, `${field}[${i}]`, itemMax));
}

/**
 * Validate one task contract and return a clean copy with defaults filled in.
 * `files` are the paths this task OWNS; two tasks may not own the same path.
 */
export function normalizeContract(raw, index = 0) {
  const where = `tasks[${index}]`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ContractError(`${where} must be an object`);

  const actions = strings(raw.allowedActions, `${where}.allowedActions`, { max: 10, itemMax: 30 }) ?? ['read_repo', 'write_code'];
  const bad = actions.find((a) => !ACTIONS.has(a));
  if (bad) throw new ContractError(`${where}.allowedActions: unknown action "${bad}"`);

  let usd = 1;
  if (raw.budget !== undefined) {
    usd = raw.budget?.usd;
    if (typeof usd !== 'number' || !(usd > 0) || usd > 5) throw new ContractError(`${where}.budget.usd must be a number in (0, 5]`);
  }

  let files;
  try {
    files = strings(raw.files, `${where}.files`, { max: 50, itemMax: 200 })?.map(sanitizePath);
  } catch (e) {
    throw e instanceof ArtifactError ? new ContractError(`${where}.files: ${e.message}`) : e;
  }

  const contract = {
    objective: text(raw.objective, `${where}.objective`, 300),
    expectedOutput: text(raw.expectedOutput, `${where}.expectedOutput`, 1000),
    successCriteria: strings(raw.successCriteria, `${where}.successCriteria`, { max: 10, itemMax: 300, required: true }),
    allowedActions: actions,
    budget: { usd },
    ownerAgent: text(raw.ownerAgent, `${where}.ownerAgent`, 40, { required: false }) ?? 'coder',
  };
  if (files) contract.files = files;
  const notes = text(raw.notes, `${where}.notes`, 2000, { required: false });
  if (notes) contract.notes = notes;
  const tools = strings(raw.requiredTools, `${where}.requiredTools`, { max: 10, itemMax: 40 });
  if (tools) contract.requiredTools = tools;
  return contract;
}

/** Normalise a whole plan; rejects a file path owned by more than one task. */
export function normalizePlan(body) {
  const outcome = text(body?.outcome, 'outcome', LIMITS.maxOutcomeChars);
  const tasks = body?.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) throw new ContractError('tasks must be a non-empty array');
  if (tasks.length > LIMITS.maxTasks) throw new ContractError(`too many tasks (max ${LIMITS.maxTasks})`);

  const contracts = tasks.map((t, i) => normalizeContract(t, i));
  const owner = new Map();
  contracts.forEach((c, i) => {
    for (const f of c.files || []) {
      if (owner.has(f)) throw new ContractError(`file "${f}" is owned by both tasks[${owner.get(f)}] and tasks[${i}]`);
      owner.set(f, i);
    }
  });
  return { outcome, contracts };
}

/**
 * The tasks a room works on: tasks planned for THIS room's current plan, plus project-level
 * tasks that carry no roomId (created by the lead agent). Re-planning a room supersedes its
 * earlier plan without deleting anything, so old committed tasks never leak into a new run.
 */
export function tasksForRoom(tasks, room) {
  return tasks.filter((t) => {
    if (!t.roomId) return true;
    if (t.roomId !== room.roomId) return false;
    return !room.planId || t.planId === room.planId;
  });
}
