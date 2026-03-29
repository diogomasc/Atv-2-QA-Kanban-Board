// --- Union Types ---
export type TaskStatus = 'open' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

// --- Objetos Constantes (centralizam os valores válidos) ---
export const TASK_STATUS: Readonly<Record<string, TaskStatus>> = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;

export const TASK_PRIORITY: Readonly<Record<string, TaskPriority>> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// --- Constantes nomeadas (compatibilidade) ---
export const STATUS_OPEN: TaskStatus = 'open';
export const STATUS_IN_PROGRESS: TaskStatus = 'in-progress';
export const STATUS_DONE: TaskStatus = 'done';

export const PRIORITY_LOW: TaskPriority = 'low';
export const PRIORITY_MEDIUM: TaskPriority = 'medium';
export const PRIORITY_HIGH: TaskPriority = 'high';

// --- Interfaces ---
export interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assignee?: string;
  deadline?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assignee?: string;
  deadline?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

export interface StatusCount {
  open: number;
  inProgress: number;
  done: number;
}

export interface PriorityCount {
  high: number;
  medium: number;
  low: number;
}

export interface Stats {
  total: number;
  byStatus: StatusCount;
  byPriority: PriorityCount;
}

export interface StatsResponse {
  total: number;
  byStatus: StatusCount;
  byPriority: PriorityCount;
}
