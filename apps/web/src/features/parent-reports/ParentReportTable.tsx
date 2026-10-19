'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import type { ParentReportItem } from './api';
import { canSendParentReport, sentQuartersInRange } from './parent-report-range';

export function ParentReportTable({
  items,
  loading,
  noMatches,
  fromQuarter,
  toQuarter,
  sendingId,
  onPreview,
  onSend,
}: {
  items: ParentReportItem[];
  loading: boolean;
  noMatches: boolean;
  fromQuarter: string;
  toQuarter: string;
  sendingId: string | undefined | null;
  onPreview: (studentId: string) => Promise<void>;
  onSend: (studentId: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  if (loading) {
    return <p className="text-sm text-slate-500">{t('loading')}</p>;
  }
  if (noMatches) {
    return <p className="text-sm text-slate-500">{t('noMatches')}</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{t('empty')}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">{t('student')}</th>
            <th className="px-4 py-3 font-medium">{t('parent')}</th>
            <th className="px-4 py-3 font-medium">{t('email')}</th>
            <th className="px-4 py-3 font-medium">{t('group')}</th>
            <th className="px-4 py-3 font-medium">{t('status')}</th>
            <th className="px-4 py-3 font-medium">{t('sentQuartersColumn')}</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ReportRow
              key={item.studentId}
              item={item}
              quarters={sentQuartersInRange(item.sentQuarters, fromQuarter, toQuarter)}
              sending={sendingId === item.studentId}
              onPreview={onPreview}
              onSend={onSend}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportRow({
  item,
  quarters,
  sending,
  onPreview,
  onSend,
}: {
  item: ParentReportItem;
  quarters: number;
  sending: boolean;
  onPreview: (studentId: string) => Promise<void>;
  onSend: (studentId: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  const canSend = canSendParentReport(item);
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">{item.studentName}</td>
      <td className="px-4 py-3">{item.parentName || '—'}</td>
      <td className="px-4 py-3">{item.parentEmail || t('missingEmail')}</td>
      <td className="px-4 py-3">{item.groupName || '—'}</td>
      <td className="px-4 py-3">{statusLabel(item, t)}</td>
      <td className="px-4 py-3">{t('sentQuarters', { count: quarters })}</td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void onPreview(item.studentId)}>
            {t('preview')}
          </Button>
          <Button type="button" size="sm" disabled={!canSend || sending} onClick={() => onSend(item.studentId)}>
            {t('send')}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function statusLabel(
  item: ParentReportItem,
  t: (key: string, values?: { date: string }) => string,
): string {
  if (!item.receiveReports) return t('reportsOff');
  if (!item.parentEmail) return t('missingEmail');
  if (item.sentAt) return t('sentOn', { date: new Date(item.sentAt).toLocaleDateString() });
  return t('notSent');
}
