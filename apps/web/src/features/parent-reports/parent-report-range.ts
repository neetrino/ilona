export const NO_GROUP_ID = 'none';

export type ParentReportFilterInput = {
  groupIds: Set<string>;
  statusIds: Set<string>;
  search: string;
};

type FilterableReport = {
  studentName: string;
  parentName: string | null;
  parentEmail: string | null;
  groupId: string | null;
  receiveReports: boolean;
  sentAt: string | null;
};

type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

const QUARTER_MONTHS: Record<number, MonthNumber[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

export function quarterMonthNumbers(quarterKey: string): MonthNumber[] {
  return QUARTER_MONTHS[Number(quarterKey.slice(6))] ?? [];
}

export function formatQuarterMonths(quarterKey: string, monthName: (month: number) => string): string {
  const names = quarterMonthNumbers(quarterKey).map((month) => monthName(month));
  return names.length === 3 ? `${names.join(' · ')} ${quarterKey.slice(0, 4)}` : quarterKey;
}

export function filterParentReports<T extends FilterableReport>(
  items: T[],
  input: ParentReportFilterInput,
): T[] {
  const query = input.search.trim().toLowerCase();
  return items.filter((item) => matchesReport(item, input, query));
}

export function canSendParentReport(item: FilterableReport): boolean {
  return Boolean(item.parentEmail) && item.receiveReports && !item.sentAt;
}

function matchesReport(item: FilterableReport, input: ParentReportFilterInput, query: string): boolean {
  if (input.groupIds.size > 0 && !input.groupIds.has(item.groupId ?? NO_GROUP_ID)) {
    return false;
  }
  if (input.statusIds.size > 0 && !matchesStatus(item, input.statusIds)) {
    return false;
  }
  if (!query) {
    return true;
  }
  const haystack = [item.studentName, item.parentName, item.parentEmail].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query);
}

function matchesStatus(item: FilterableReport, statusIds: Set<string>): boolean {
  const tags = [
    item.sentAt ? 'sent' : 'notSent',
    item.parentEmail ? '' : 'missingEmail',
    item.receiveReports ? '' : 'reportsOff',
  ];
  return tags.some((tag) => tag && statusIds.has(tag));
}
