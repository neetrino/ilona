import { api } from '@/shared/lib/api';

export type ParentReportItem = {
  studentId: string;
  studentName: string;
  parentName: string | null;
  parentEmail: string | null;
  groupId: string | null;
  groupName: string | null;
  sentAt: string | null;
  sentQuarters: string[];
};

export type ParentReportHistoryItem = {
  quarterKey: string;
  sent: number;
};

export type ParentReportList = {
  quarterKey: string;
  currentQuarterKey: string;
  daysPassed: number;
  daysLeft: number;
  history: ParentReportHistoryItem[];
  items: ParentReportItem[];
};

export type ParentReportLetter = {
  subject: string;
  html: string;
  text: string;
};

const BASE = '/parent-reports';

export async function fetchParentReports(quarterKey?: string): Promise<ParentReportList> {
  const query = quarterKey ? `?quarterKey=${encodeURIComponent(quarterKey)}` : '';
  return api.get<ParentReportList>(`${BASE}${query}`);
}

export async function previewParentReport(
  studentId: string,
  quarterKey: string,
): Promise<ParentReportLetter> {
  const params = new URLSearchParams({ studentId, quarterKey });
  return api.get<ParentReportLetter>(`${BASE}/preview?${params.toString()}`);
}

export async function sendParentReport(
  studentId: string,
  quarterKey: string,
): Promise<{ sent: boolean }> {
  return api.post<{ sent: boolean }>(`${BASE}/send`, { studentId, quarterKey });
}

export async function sendParentQuarter(
  quarterKey: string,
  studentIds: string[],
): Promise<{ sent: number; skipped: number }> {
  return api.post<{ sent: number; skipped: number }>(`${BASE}/send-all`, { quarterKey, studentIds });
}
