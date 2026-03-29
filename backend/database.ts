import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

const currentFilename: string = fileURLToPath(import.meta.url);
const currentDirname: string = path.dirname(currentFilename);

export interface IDatabaseService {
  setup(): void;
  getInstance(): Database.Database;
}

class DatabaseService implements IDatabaseService {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  public setup(): void {
    log('database', 'iniciando banco de dados...');
    this.db.exec(`
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
    log('database', 'banco de dados pronto');
  }

  public getInstance(): Database.Database {
    return this.db;
  }
}

const DB_PATH: string = path.join(currentDirname, 'kanban.db');

export const databaseService: IDatabaseService = new DatabaseService(DB_PATH);

export function createDatabaseService(dbPath: string): IDatabaseService {
  return new DatabaseService(dbPath);
}
