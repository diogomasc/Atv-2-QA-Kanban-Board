import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var db = new Database(path.join(__dirname, "kanban.db"));

export function setupDatabase(): any {
  console.log("iniciando banco de dados...");

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

  console.log("banco de dados pronto");
  return db;
}

export function getDb(): any {
  return db;
}
