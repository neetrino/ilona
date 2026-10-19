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

export function quarterKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
}

export function recentQuarterKeys(anchor: Date, count = 8): string[] {
  const keys: string[] = [];
  let year = anchor.getFullYear();
  let quarter = Math.ceil((anchor.getMonth() + 1) / 3);
  for (let index = 0; index < count; index += 1) {
    keys.unshift(`${year}-Q${quarter}`);
    quarter -= 1;
    if (quarter === 0) {
      quarter = 4;
      year -= 1;
    }
  }
  return keys;
}

export function quartersInRange(from: string, to: string): string[] {
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const keys: string[] = [];
  let year = Number(start.slice(0, 4));
  let quarter = Number(start.slice(6));
  const endYear = Number(end.slice(0, 4));
  const endQuarter = Number(end.slice(6));
  while (year < endYear || (year === endYear && quarter <= endQuarter)) {
    keys.push(`${year}-Q${quarter}`);
    quarter += 1;
    if (quarter === 5) {
      quarter = 1;
      year += 1;
    }
  }
  return keys;
}

export function sentQuartersInRange(sentQuarters: string[] | undefined, from: string, to: string): number {
  const range = new Set(quartersInRange(from, to));
  return (sentQuarters ?? []).filter((key) => range.has(key)).length;
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
