import {
  filterParentReports,
  formatQuarterMonths,
  quarterMonthNumbers,
  quartersInRange,
  sentQuartersInRange,
} from '../../../../web/src/features/parent-reports/parent-report-range';

describe('parent report range', () => {
  it('counts sent quarters inside the selected range', () => {
    expect(quartersInRange('2026-Q1', '2026-Q4')).toEqual(['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4']);
    expect(sentQuartersInRange(['2026-Q1', '2026-Q2'], '2026-Q1', '2026-Q4')).toBe(2);
  });

  it('names the three months of a quarter', () => {
    expect(quarterMonthNumbers('2026-Q4')).toEqual([10, 11, 12]);
    expect(formatQuarterMonths('2026-Q1', (month) => String(month))).toBe('1 · 2 · 3 2026');
  });

  it('counts a sent quarter only when it is inside the range', () => {
    expect(sentQuartersInRange(['2026-Q4'], '2026-Q1', '2026-Q3')).toBe(0);
  });

  it('filters by group, status, and search together', () => {
    const items = [report('Ann', 'Ohio', 'sent'), report('Ben', 'Bristol', null)];
    const shown = filterParentReports(items, {
      groupIds: new Set(['Ohio']),
      statusIds: new Set(['sent']),
      search: 'ann',
    });
    expect(shown.map((item) => item.studentName)).toEqual(['Ann']);
  });
});

function report(studentName: string, groupId: string, sentAt: string | null) {
  return {
    studentName,
    parentName: null,
    parentEmail: 'parent@example.com',
    groupId,
    receiveReports: true,
    sentAt,
  };
}
