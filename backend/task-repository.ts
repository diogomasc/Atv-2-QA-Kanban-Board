import {
  Task,
  TaskFilter,
  TaskStatus,
  CreateTaskData,
  UpdateTaskData,
  Stats,
  TASK_STATUS,
  TASK_PRIORITY,
} from '../src/models.js';
import { IDatabaseService } from './database.js';
import { buildFilterQuery } from './query-builder.js';
import { log } from './logger.js';

interface CountRow {
  count: number;
}

export interface ITaskRepository {
  findAll(filter: TaskFilter): Task[];
  findById(id: number): Task | undefined;
  create(data: CreateTaskData): Task;
  update(id: number, data: UpdateTaskData): Task | undefined;
  updateStatus(id: number, status: TaskStatus): Task | undefined;
  remove(id: number): boolean;
  getStats(): Stats;
}

export class TaskRepository implements ITaskRepository {
  private readonly dbService: IDatabaseService;

  constructor(dbService: IDatabaseService) {
    this.dbService = dbService;
  }

  public findAll(filter: TaskFilter): Task[] {
    const db = this.dbService.getInstance();
    const { sql, params } = buildFilterQuery(filter);
    log('repository', `findAll: ${sql}`);
    return db.prepare(sql).all(...params) as Task[];
  }

  public findById(id: number): Task | undefined {
    const db = this.dbService.getInstance();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row as Task | undefined;
  }

  public create(data: CreateTaskData): Task {
    const db = this.dbService.getInstance();
    const status = data.status ?? TASK_STATUS.OPEN;
    const priority = data.priority ?? TASK_PRIORITY.MEDIUM;
    const createdAt = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO tasks (title, description, assignee, deadline, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      data.title,
      data.description ?? '',
      data.assignee ?? '',
      data.deadline ?? '',
      status,
      priority,
      createdAt
    );

    log('repository', `created task id: ${result.lastInsertRowid}`);
    return this.findById(Number(result.lastInsertRowid)) as Task;
  }

  public update(id: number, data: UpdateTaskData): Task | undefined {
    const db = this.dbService.getInstance();
    const existing = this.findById(id);
    if (existing === undefined) {
      return undefined;
    }

    const title = data.title ?? existing.title;
    const description = data.description ?? existing.description;
    const assignee = data.assignee ?? existing.assignee;
    const deadline = data.deadline ?? existing.deadline;
    const status = data.status ?? existing.status;
    const priority = data.priority ?? existing.priority;

    db.prepare(
      'UPDATE tasks SET title = ?, description = ?, assignee = ?, deadline = ?, status = ?, priority = ? WHERE id = ?'
    ).run(title, description, assignee, deadline, status, priority, id);

    log('repository', `updated task id: ${id}`);
    return this.findById(id);
  }

  public updateStatus(id: number, status: TaskStatus): Task | undefined {
    const db = this.dbService.getInstance();
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, id);
    log('repository', `updated status of task ${id} to ${status}`);
    return this.findById(id);
  }

  public remove(id: number): boolean {
    const db = this.dbService.getInstance();
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    log('repository', `removed task id: ${id}`);
    return true;
  }

  public getStats(): Stats {
    const db = this.dbService.getInstance();
    const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as CountRow;
    const open = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open'").get() as CountRow;
    const inProgress = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in-progress'").get() as CountRow;
    const done = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get() as CountRow;
    const high = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high'").get() as CountRow;
    const medium = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'medium'").get() as CountRow;
    const low = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'low'").get() as CountRow;

    return {
      total: total.count,
      byStatus: {
        open: open.count,
        inProgress: inProgress.count,
        done: done.count,
      },
      byPriority: {
        high: high.count,
        medium: medium.count,
        low: low.count,
      },
    };
  }
}
