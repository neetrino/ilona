import { quarterBounds, quarterKeyFromDate, previousQuarterKey } from './parent-quarter.util';

describe('parent quarter keys', () => {
  it('maps a Yerevan date to its quarter', () => {
    expect(quarterKeyFromDate(new Date('2026-10-19T08:00:00.000Z'))).toBe('2026-Q4');
  });

  it('steps back across the year boundary', () => {
    expect(previousQuarterKey('2026-Q1')).toBe('2025-Q4');
  });

  it('bounds a quarter in Asia/Yerevan', () => {
    const bounds = quarterBounds('2026-Q4');
    expect(bounds.start.toISOString()).toBe('2026-09-30T20:00:00.000Z');
    expect(bounds.end.toISOString()).toBe('2026-12-31T20:00:00.000Z');
  });
});
