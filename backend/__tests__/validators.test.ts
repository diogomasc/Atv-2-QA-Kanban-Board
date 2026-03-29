import { isValidStatus, isValidPriority, isValidStatusTransition, isNonEmpty } from '../validators';

describe('isValidStatus', (): void => {
  it('should return true for valid statuses', (): void => {
    expect(isValidStatus('open')).toBe(true);
    expect(isValidStatus('in-progress')).toBe(true);
    expect(isValidStatus('done')).toBe(true);
  });

  it('should return false for invalid statuses', (): void => {
    expect(isValidStatus('invalid')).toBe(false);
    expect(isValidStatus('')).toBe(false);
    expect(isValidStatus(null)).toBe(false);
    expect(isValidStatus(undefined)).toBe(false);
    expect(isValidStatus(123)).toBe(false);
  });
});

describe('isValidPriority', (): void => {
  it('should return true for valid priorities', (): void => {
    expect(isValidPriority('low')).toBe(true);
    expect(isValidPriority('medium')).toBe(true);
    expect(isValidPriority('high')).toBe(true);
  });

  it('should return false for invalid priorities', (): void => {
    expect(isValidPriority('invalid')).toBe(false);
    expect(isValidPriority('')).toBe(false);
    expect(isValidPriority(null)).toBe(false);
    expect(isValidPriority(undefined)).toBe(false);
    expect(isValidPriority(42)).toBe(false);
  });
});

describe('isValidStatusTransition', (): void => {
  it('should allow open -> in-progress', (): void => {
    expect(isValidStatusTransition('open', 'in-progress')).toBe(true);
  });

  it('should allow open -> done', (): void => {
    expect(isValidStatusTransition('open', 'done')).toBe(true);
  });

  it('should allow in-progress -> done', (): void => {
    expect(isValidStatusTransition('in-progress', 'done')).toBe(true);
  });

  it('should allow in-progress -> open', (): void => {
    expect(isValidStatusTransition('in-progress', 'open')).toBe(true);
  });

  it('should allow done -> open', (): void => {
    expect(isValidStatusTransition('done', 'open')).toBe(true);
  });

  it('should allow done -> in-progress', (): void => {
    expect(isValidStatusTransition('done', 'in-progress')).toBe(true);
  });

  it('should reject same-status transition', (): void => {
    expect(isValidStatusTransition('open', 'open')).toBe(false);
    expect(isValidStatusTransition('in-progress', 'in-progress')).toBe(false);
    expect(isValidStatusTransition('done', 'done')).toBe(false);
  });
});

describe('isNonEmpty', (): void => {
  it('should return true for non-empty strings', (): void => {
    expect(isNonEmpty('hello')).toBe(true);
    expect(isNonEmpty('a')).toBe(true);
  });

  it('should return false for null', (): void => {
    expect(isNonEmpty(null)).toBe(false);
  });

  it('should return false for undefined', (): void => {
    expect(isNonEmpty(undefined)).toBe(false);
  });

  it('should return false for empty string', (): void => {
    expect(isNonEmpty('')).toBe(false);
  });

  it('should return false for whitespace-only string', (): void => {
    expect(isNonEmpty('   ')).toBe(false);
  });

  it('should return false for non-string types', (): void => {
    expect(isNonEmpty(123)).toBe(false);
    expect(isNonEmpty(true)).toBe(false);
  });
});
