import { TaskFilter } from '../src/models.js';

interface FilterQueryResult {
  sql: string;
  params: string[];
}

const FILTER_COLUMN_MAP: Readonly<Record<keyof TaskFilter, string>> = {
  status: 'status',
  priority: 'priority',
  assignee: 'assignee',
};

export function buildFilterQuery(filter: TaskFilter): FilterQueryResult {
  const conditions: string[] = [];
  const params: string[] = [];

  const keys = Object.keys(filter) as (keyof TaskFilter)[];

  for (const key of keys) {
    const value = filter[key];
    if (value !== undefined && value !== '') {
      const column = FILTER_COLUMN_MAP[key];
      conditions.push(`${column} = ?`);
      params.push(value);
    }
  }

  const whereClause = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  const sql = `SELECT * FROM tasks${whereClause}`;

  return { sql, params };
}
