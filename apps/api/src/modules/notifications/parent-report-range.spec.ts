import {
  filterParentReports,
  formatQuarterMonths,
  quarterMonthNumbers,
} from '../../../../web/src/features/parent-reports/parent-report-range';

describe('parent report range', () => {
  it('names the three months of a quarter', () => {
    expect(quarterMonthNumbers('2026-Q4')).toEqual([10, 11, 12]);
    expect(formatQuarterMonths('2026-Q1', (month) => String(month))).toBe('1 · 2 · 3 2026');
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
    sentAt,
  };
}
