import {
  TaskStatus,
  TaskPriority,
  TASK_STATUS,
  TASK_PRIORITY,
} from '../src/models.js';

const VALID_STATUSES: readonly string[] = Object.values(TASK_STATUS);
const VALID_PRIORITIES: readonly string[] = Object.values(TASK_PRIORITY);

const ALLOWED_TRANSITIONS: ReadonlyMap<TaskStatus, ReadonlySet<TaskStatus>> = new Map([
  [TASK_STATUS.OPEN, new Set<TaskStatus>([TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE])],
  [TASK_STATUS.IN_PROGRESS, new Set<TaskStatus>([TASK_STATUS.OPEN, TASK_STATUS.DONE])],
  [TASK_STATUS.DONE, new Set<TaskStatus>([TASK_STATUS.OPEN, TASK_STATUS.IN_PROGRESS])],
]);

export function isValidStatus(status: unknown): status is TaskStatus {
  return typeof status === 'string' && VALID_STATUSES.includes(status);
}

export function isValidPriority(priority: unknown): priority is TaskPriority {
  return typeof priority === 'string' && VALID_PRIORITIES.includes(priority);
}

export function isValidStatusTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) {
    return false;
  }
  const allowed = ALLOWED_TRANSITIONS.get(from);
  return allowed !== undefined && allowed.has(to);
}

export function isNonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return typeof value === 'string' && value.trim() !== '';
}
