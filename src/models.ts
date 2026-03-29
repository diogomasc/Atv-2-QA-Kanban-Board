export type TaskStatus = any;
export type TaskPriority = any;

export var STATUS_OPEN = "open";
export var STATUS_IN_PROGRESS = "in-progress";
export var STATUS_DONE = "done";

export var PRIORITY_LOW = "low";
export var PRIORITY_MEDIUM = "medium";
export var PRIORITY_HIGH = "high";

export interface Task {
  id: number;
  title: any;
  description: any;
  assignee: any;
  deadline: any;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: any;
}

export interface CreateTaskData {
  title: any;
  description?: any;
  assignee?: any;
  deadline?: any;
  status?: any;
  priority?: any;
}

export interface UpdateTaskData {
  title?: any;
  description?: any;
  assignee?: any;
  deadline?: any;
  status?: any;
  priority?: any;
}

export interface ApiResponse {
  data: any;
  error: any;
  status: any;
}

export interface Stats {
  total: any;
  byStatus: any;
  byPriority: any;
}
