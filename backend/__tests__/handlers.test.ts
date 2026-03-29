import Database from 'better-sqlite3';
import { TaskRepository } from '../task-repository';
import { IDatabaseService } from '../database';
import { ITaskRepository } from '../task-repository';
import { Request, Response } from 'express';

// We test handlers indirectly through the repository since handlers
// are thin wrappers. Direct handler testing uses mock req/res.

function createTestRepo(): ITaskRepository {
  const db = new Database(':memory:');
  const dbService: IDatabaseService = {
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
  dbService.setup();
  return new TaskRepository(dbService);
}

interface MockRes {
  status(code: number): MockRes;
  json(data: unknown): void;
}

function createMockRes(): { res: MockRes; getStatus: () => number; getBody: () => unknown } {
  let statusCode = 200;
  let body: unknown = {};
  const res: MockRes = {
    status(code: number): MockRes {
      statusCode = code;
      return res;
    },
    json(data: unknown): void {
      body = data;
    },
  };
  return {
    res,
    getStatus: (): number => statusCode,
    getBody: (): unknown => body,
  };
}

// Import handlers module to test registerRoutes' internal functions
// We test by importing registerRoutes and using a real Express app
// with supertest-like approach using http

import http from 'http';
import express from 'express';
import { registerRoutes } from '../handlers';

function createTestServer(): http.Server {
  const repo = createTestRepo();
  const app = express();
  app.use(express.json());
  registerRoutes(app, repo);
  return http.createServer(app);
}

function httpRequest(
  server: http.Server,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject): void => {
    const address = server.address();
    if (address === null || typeof address === 'string') {
      reject(new Error('Server not listening'));
      return;
    }
    const port = address.port;
    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res): void => {
      let data = '';
      res.on('data', (chunk: string): void => {
        data += chunk;
      });
      res.on('end', (): void => {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        resolve({ status: res.statusCode ?? 500, body: parsed });
      });
    });

    req.on('error', reject);
    if (bodyStr !== undefined) {
      req.write(bodyStr);
    }
    req.end();
  });
}

describe('Handlers Integration', (): void => {
  let server: http.Server;

  beforeEach((done): void => {
    server = createTestServer();
    server.listen(0, (): void => {
      done();
    });
  });

  afterEach((done): void => {
    server.close((): void => {
      done();
    });
  });

  describe('POST /api/tasks', (): void => {
    it('should create a task', async (): Promise<void> => {
      const res = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Nova tarefa',
      });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Nova tarefa');
    });

    it('should reject empty title', async (): Promise<void> => {
      const res = await httpRequest(server, 'POST', '/api/tasks', { title: '' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid status', async (): Promise<void> => {
      const res = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Test',
        status: 'invalid',
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid priority', async (): Promise<void> => {
      const res = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Test',
        priority: 'invalid',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tasks', (): void => {
    it('should return all tasks', async (): Promise<void> => {
      await httpRequest(server, 'POST', '/api/tasks', { title: 'T1' });
      await httpRequest(server, 'POST', '/api/tasks', { title: 'T2' });
      const res = await httpRequest(server, 'GET', '/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/tasks/:id', (): void => {
    it('should return task by id', async (): Promise<void> => {
      const created = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Find me',
      });
      const id = created.body.id;
      const res = await httpRequest(server, 'GET', `/api/tasks/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Find me');
    });

    it('should return 404 for missing task', async (): Promise<void> => {
      const res = await httpRequest(server, 'GET', '/api/tasks/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/:id', (): void => {
    it('should update a task', async (): Promise<void> => {
      const created = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Original',
      });
      const id = created.body.id;
      const res = await httpRequest(server, 'PUT', `/api/tasks/${id}`, {
        title: 'Updated',
      });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
    });

    it('should return 404 for missing task', async (): Promise<void> => {
      const res = await httpRequest(server, 'PUT', '/api/tasks/999', {
        title: 'X',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/tasks/:id/status', (): void => {
    it('should update status', async (): Promise<void> => {
      const created = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Test',
        status: 'open',
      });
      const id = created.body.id;
      const res = await httpRequest(server, 'PATCH', `/api/tasks/${id}/status`, {
        status: 'in-progress',
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in-progress');
    });

    it('should reject invalid status', async (): Promise<void> => {
      const created = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Test',
      });
      const id = created.body.id;
      const res = await httpRequest(server, 'PATCH', `/api/tasks/${id}/status`, {
        status: 'invalid',
      });
      expect(res.status).toBe(400);
    });

    it('should reject same-status transition', async (): Promise<void> => {
      const created = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Test',
        status: 'open',
      });
      const id = created.body.id;
      const res = await httpRequest(server, 'PATCH', `/api/tasks/${id}/status`, {
        status: 'open',
      });
      expect(res.status).toBe(400);
    });

    it('should return 404 for missing task', async (): Promise<void> => {
      const res = await httpRequest(server, 'PATCH', '/api/tasks/999/status', {
        status: 'done',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', (): void => {
    it('should delete a task', async (): Promise<void> => {
      const created = await httpRequest(server, 'POST', '/api/tasks', {
        title: 'Delete me',
      });
      const id = created.body.id;
      const res = await httpRequest(server, 'DELETE', `/api/tasks/${id}`);
      expect(res.status).toBe(200);
    });

    it('should return 404 for missing task', async (): Promise<void> => {
      const res = await httpRequest(server, 'DELETE', '/api/tasks/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/stats', (): void => {
    it('should return stats', async (): Promise<void> => {
      await httpRequest(server, 'POST', '/api/tasks', {
        title: 'T1',
        priority: 'high',
      });
      await httpRequest(server, 'POST', '/api/tasks', {
        title: 'T2',
        priority: 'low',
      });
      const res = await httpRequest(server, 'GET', '/api/stats');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });
  });
});
