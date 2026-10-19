import {
  quarterBounds,
  quarterKeyFromDate,
  quarterSendProgress,
  previousQuarterKey,
  recentQuarterKeys,
} from './parent-quarter.util';

describe('parent quarter keys', () => {
  it('maps a Yerevan date to its quarter', () => {
    expect(quarterKeyFromDate(new Date('2026-10-19T08:00:00.000Z'))).toBe('2026-Q4');
  });

  it('steps back across the year boundary', () => {
    expect(previousQuarterKey('2026-Q1')).toBe('2025-Q4');
    expect(recentQuarterKeys('2026-Q1', 3)).toEqual(['2026-Q1', '2025-Q4', '2025-Q3']);
  });

  it('counts days until the last day of the quarter', () => {
    expect(quarterSendProgress('2026-Q4', new Date('2026-10-19T08:00:00.000Z'))).toEqual({
      daysPassed: 19,
      daysLeft: 73,
      sendOn: '2026-12-31',
    });
  });

  it('is ready to send on the last day', () => {
    const progress = quarterSendProgress('2026-Q4', new Date('2026-12-31T08:00:00.000Z'));
    expect(progress.daysLeft).toBe(0);
    expect(progress.daysPassed).toBe(92);
  });

  it('bounds a quarter in Asia/Yerevan', () => {
    const bounds = quarterBounds('2026-Q4');
    expect(bounds.start.toISOString()).toBe('2026-09-30T20:00:00.000Z');
    expect(bounds.end.toISOString()).toBe('2026-12-31T20:00:00.000Z');
  });
});
