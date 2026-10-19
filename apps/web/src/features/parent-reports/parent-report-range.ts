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

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function recentMonthKeys(anchor: Date, count = 24): string[] {
  const keys: string[] = [];
  let year = anchor.getFullYear();
  let month = anchor.getMonth() + 1;
  for (let index = 0; index < count; index += 1) {
    keys.unshift(monthKey(year, month));
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return keys;
}

export function monthsInRange(from: string, to: string): string[] {
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const keys: string[] = [];
  let [year, month] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(monthKey(year, month));
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

export function sentMonthsInRange(sentQuarters: string[], from: string, to: string): number {
  const sent = new Set(sentQuarters);
  return monthsInRange(from, to).filter((key) => {
    const [year, month] = key.split('-').map(Number);
    return sent.has(`${year}-Q${Math.ceil(month / 3)}`);
  }).length;
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
