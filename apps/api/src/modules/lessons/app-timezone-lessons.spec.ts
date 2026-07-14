import { getZonedParts, wallTimeToUtc } from '@ilona/types';

describe('lesson wall-clock timezone (Asia/Yerevan)', () => {
  it('converts Admin start time to UTC without shifting the displayed hour', () => {
    const utc = wallTimeToUtc('2026-07-14', '10:00');
    const parts = getZonedParts(utc);

    expect(parts.ymd).toBe('2026-07-14');
    expect(parts.timeHHmm).toBe('10:00');
    expect(utc.toISOString()).toBe('2026-07-14T06:00:00.000Z');
  });
});
