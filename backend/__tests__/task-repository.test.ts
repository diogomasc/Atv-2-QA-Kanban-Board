import Database from 'better-sqlite3';
import { TaskRepository } from '../task-repository';
import { IDatabaseService } from '../database';
import { Task } from '../../src/models';

function createInMemoryService(): IDatabaseService {
  const db = new Database(':memory:');
  return {
    setup(): void {
      db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT,
          assignee TEXT,
          deadline TEXT,
          status TEXT,
          priority TEXT,
          created_at TEXT
        )
      `);
    },
    getInstance(): Database.Database {
      return db;
    },
  };
}

describe('TaskRepository', (): void => {
  let repo: TaskRepository;
  let dbService: IDatabaseService;

  beforeEach((): void => {
    dbService = createInMemoryService();
    dbService.setup();
    repo = new TaskRepository(dbService);
  });

  describe('create', (): void => {
    it('should create a task with defaults', (): void => {
      const task: Task = repo.create({ title: 'Tarefa 1' });
      expect(task.id).toBe(1);
      expect(task.title).toBe('Tarefa 1');
      expect(task.status).toBe('open');
      expect(task.priority).toBe('medium');
    });

    it('should create a task with explicit values', (): void => {
      const task: Task = repo.create({
        title: 'Tarefa 2',
        description: 'Desc',
        assignee: 'João',
        deadline: '2026-12-31',
        status: 'in-progress',
        priority: 'high',
      });
      expect(task.title).toBe('Tarefa 2');
      expect(task.status).toBe('in-progress');
      expect(task.priority).toBe('high');
      expect(task.assignee).toBe('João');
    });
  });

  describe('findAll', (): void => {
    beforeEach((): void => {
      repo.create({ title: 'A', status: 'open', priority: 'low' });
      repo.create({ title: 'B', status: 'done', priority: 'high' });
      repo.create({ title: 'C', status: 'open', priority: 'high', assignee: 'Ana' });
    });

    it('should return all tasks with no filter', (): void => {
      const tasks: Task[] = repo.findAll({});
      expect(tasks).toHaveLength(3);
    });

    it('should filter by status', (): void => {
      const tasks: Task[] = repo.findAll({ status: 'open' });
      expect(tasks).toHaveLength(2);
    });

    it('should filter by priority', (): void => {
      const tasks: Task[] = repo.findAll({ priority: 'high' });
      expect(tasks).toHaveLength(2);
    });

    it('should filter by status and priority', (): void => {
      const tasks: Task[] = repo.findAll({ status: 'open', priority: 'high' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('C');
    });

    it('should filter by assignee', (): void => {
      const tasks: Task[] = repo.findAll({ assignee: 'Ana' });
      expect(tasks).toHaveLength(1);
    });
  });

  describe('findById', (): void => {
    it('should find existing task', (): void => {
      const created: Task = repo.create({ title: 'Test' });
      const found = repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe('Test');
    });

    it('should return undefined for non-existent id', (): void => {
      const found = repo.findById(999);
      expect(found).toBeUndefined();
    });
  });

  describe('update', (): void => {
    it('should update task fields', (): void => {
      const created: Task = repo.create({ title: 'Original' });
      const updated = repo.update(created.id, { title: 'Updated' });
      expect(updated?.title).toBe('Updated');
    });

    it('should return undefined for non-existent id', (): void => {
      const result = repo.update(999, { title: 'X' });
      expect(result).toBeUndefined();
    });

    it('should preserve unchanged fields', (): void => {
      const created: Task = repo.create({
        title: 'Keep',
        description: 'My desc',
        priority: 'high',
      });
      const updated = repo.update(created.id, { title: 'New Title' });
      expect(updated?.description).toBe('My desc');
      expect(updated?.priority).toBe('high');
    });
  });

  describe('updateStatus', (): void => {
    it('should update task status', (): void => {
      const created: Task = repo.create({ title: 'Test', status: 'open' });
      const updated = repo.updateStatus(created.id, 'in-progress');
      expect(updated?.status).toBe('in-progress');
    });
  });

  describe('remove', (): void => {
    it('should remove a task', (): void => {
      const created: Task = repo.create({ title: 'To Remove' });
      const result: boolean = repo.remove(created.id);
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
  });

  describe('getStats', (): void => {
    it('should return correct stats', (): void => {
      repo.create({ title: 'A', status: 'open', priority: 'low' });
      repo.create({ title: 'B', status: 'open', priority: 'high' });
      repo.create({ title: 'C', status: 'done', priority: 'medium' });

      const stats = repo.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byStatus.open).toBe(2);
      expect(stats.byStatus.done).toBe(1);
      expect(stats.byStatus.inProgress).toBe(0);
      expect(stats.byPriority.low).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
    });

    it('should return zeros when empty', (): void => {
      const stats = repo.getStats();
      expect(stats.total).toBe(0);
    });
  });
});
