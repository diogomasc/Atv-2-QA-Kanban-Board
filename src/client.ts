import { Task, CreateTaskData, UpdateTaskData, Stats, TaskFilter, TaskStatus } from './models.js';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) {
    return false;
  }
  return typeof v === 'string' && v.trim() !== '';
}

function buildQueryString(filter: TaskFilter): string {
  const params = new URLSearchParams();
  if (hasValue(filter.status)) {
    params.set('status', filter.status as string);
  }
  if (hasValue(filter.priority)) {
    params.set('priority', filter.priority as string);
  }
  if (hasValue(filter.assignee)) {
    params.set('assignee', filter.assignee as string);
  }
  const qs = params.toString();
  return qs !== '' ? `?${qs}` : '';
}

export async function fetchAllTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const queryString = buildQueryString(filter);
  const url = `${BASE_URL}/tasks${queryString}`;
  const response = await fetch(url);

  if (response.status === HTTP_STATUS.OK) {
    return await response.json() as Task[];
  }
  return [];
}

export async function createTask(data: CreateTaskData): Promise<Task | null> {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.status === HTTP_STATUS.CREATED) {
    return await response.json() as Task;
  }
  return null;
}

export async function updateTask(id: number, data: UpdateTaskData): Promise<Task | null> {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (response.status === HTTP_STATUS.OK) {
    return await response.json() as Task;
  }
  return null;
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<Task | null> {
  const response = await fetch(`${BASE_URL}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (response.status === HTTP_STATUS.OK) {
    return await response.json() as Task;
  }
  return null;
}

export async function deleteTask(id: number): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  return response.status === HTTP_STATUS.OK;
}

export async function fetchStats(): Promise<Stats | null> {
  const response = await fetch(`${BASE_URL}/stats`);

  if (response.status === HTTP_STATUS.OK) {
    return await response.json() as Stats;
  }
  return null;
}
