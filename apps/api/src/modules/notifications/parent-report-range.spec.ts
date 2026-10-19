import {
  filterParentReports,
  monthsInRange,
  sentMonthsInRange,
} from '../../../../web/src/features/parent-reports/parent-report-range';

describe('parent report range', () => {
  it('counts months covered by a sent quarter inside the range', () => {
    expect(sentMonthsInRange(['2026-Q1', '2026-Q2'], '2026-01', '2026-10')).toBe(6);
    expect(monthsInRange('2026-01', '2026-10')).toHaveLength(10);
  });

  it('counts only the months that fall inside a partial quarter', () => {
    expect(sentMonthsInRange(['2026-Q4'], '2026-10', '2026-10')).toBe(1);
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
