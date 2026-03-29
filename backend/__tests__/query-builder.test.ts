import { buildFilterQuery } from '../query-builder';

describe('buildFilterQuery', (): void => {
  it('should return base query with no filters', (): void => {
    const result = buildFilterQuery({});
    expect(result.sql).toBe('SELECT * FROM tasks');
    expect(result.params).toEqual([]);
  });

  it('should filter by status only', (): void => {
    const result = buildFilterQuery({ status: 'open' });
    expect(result.sql).toBe('SELECT * FROM tasks WHERE status = ?');
    expect(result.params).toEqual(['open']);
  });

  it('should filter by priority only', (): void => {
    const result = buildFilterQuery({ priority: 'high' });
    expect(result.sql).toBe('SELECT * FROM tasks WHERE priority = ?');
    expect(result.params).toEqual(['high']);
  });

  it('should filter by assignee only', (): void => {
    const result = buildFilterQuery({ assignee: 'João' });
    expect(result.sql).toBe('SELECT * FROM tasks WHERE assignee = ?');
    expect(result.params).toEqual(['João']);
  });

  it('should filter by status and priority', (): void => {
    const result = buildFilterQuery({ status: 'open', priority: 'high' });
    expect(result.sql).toBe('SELECT * FROM tasks WHERE status = ? AND priority = ?');
    expect(result.params).toEqual(['open', 'high']);
  });

  it('should filter by all three fields', (): void => {
    const result = buildFilterQuery({
      status: 'done',
      priority: 'low',
      assignee: 'Maria',
    });
    expect(result.sql).toBe('SELECT * FROM tasks WHERE status = ? AND priority = ? AND assignee = ?');
    expect(result.params).toEqual(['done', 'low', 'Maria']);
  });

  it('should ignore empty string values', (): void => {
    const result = buildFilterQuery({ status: 'open', priority: '' as never });
    expect(result.sql).toBe('SELECT * FROM tasks WHERE status = ?');
    expect(result.params).toEqual(['open']);
  });

  it('should ignore undefined values', (): void => {
    const result = buildFilterQuery({ status: undefined, assignee: 'Ana' });
    expect(result.sql).toBe('SELECT * FROM tasks WHERE assignee = ?');
    expect(result.params).toEqual(['Ana']);
  });
});
