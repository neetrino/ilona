'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui/button';
import {
  fetchParentReports,
  previewParentReport,
  sendParentQuarter,
  sendParentReport,
  type ParentReportItem,
  type ParentReportLetter,
} from './api';

export function ParentReportsPage() {
  const t = useTranslations('parentReportsPage');
  const tNav = useTranslations('nav');
  const [quarterKey, setQuarterKey] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<ParentReportLetter | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['parent-reports', quarterKey ?? 'current'],
    queryFn: () => fetchParentReports(quarterKey),
  });
  const activeQuarter = quarterKey ?? query.data?.quarterKey;
  const sendOne = useMutation({
    mutationFn: (studentId: string) => sendParentReport(studentId, activeQuarter ?? ''),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['parent-reports'] }),
  });
  const sendAll = useMutation({
    mutationFn: () => sendParentQuarter(activeQuarter ?? ''),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['parent-reports'] }),
  });

  return (
    <DashboardLayout title={tNav('parentReports')} subtitle={t('subtitle')}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600" htmlFor="parent-report-quarter">
            {t('quarter')}
          </label>
          <select
            id="parent-report-quarter"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={activeQuarter ?? ''}
            onChange={(event) => setQuarterKey(event.target.value)}
          >
            {(query.data?.quarters ?? []).map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={!activeQuarter || sendAll.isPending}
            onClick={() => sendAll.mutate()}
          >
            {t('sendAll')}
          </Button>
        </div>
        {query.isError ? <p className="text-sm text-red-600">{t('loadError')}</p> : null}
        {sendAll.isError || sendOne.isError ? <p className="text-sm text-red-600">{t('sendFailed')}</p> : null}
        <ReportTable
          items={query.data?.items ?? []}
          loading={query.isLoading}
          sendingId={sendOne.isPending ? sendOne.variables : null}
          onPreview={async (studentId) => {
            if (!activeQuarter) return;
            setPreview(await previewParentReport(studentId, activeQuarter));
          }}
          onSend={(studentId) => sendOne.mutate(studentId)}
        />
        {preview ? <LetterPreview letter={preview} onClose={() => setPreview(null)} /> : null}
      </div>
    </DashboardLayout>
  );
}

function ReportTable({
  items,
  loading,
  sendingId,
  onPreview,
  onSend,
}: {
  items: ParentReportItem[];
  loading: boolean;
  sendingId: string | undefined | null;
  onPreview: (studentId: string) => Promise<void>;
  onSend: (studentId: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  if (loading) {
    return <p className="text-sm text-slate-500">{t('loading')}</p>;
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
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ReportRow
              key={item.studentId}
              item={item}
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
  sending,
  onPreview,
  onSend,
}: {
  item: ParentReportItem;
  sending: boolean;
  onPreview: (studentId: string) => Promise<void>;
  onSend: (studentId: string) => void;
}) {
  const t = useTranslations('parentReportsPage');
  const canSend = Boolean(item.parentEmail) && item.receiveReports && !item.sentAt;
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">{item.studentName}</td>
      <td className="px-4 py-3">{item.parentName || '—'}</td>
      <td className="px-4 py-3">{item.parentEmail || t('missingEmail')}</td>
      <td className="px-4 py-3">{item.groupName || '—'}</td>
      <td className="px-4 py-3">{statusLabel(item, t)}</td>
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

function LetterPreview({ letter, onClose }: { letter: ParentReportLetter; onClose: () => void }) {
  const t = useTranslations('parentReportsPage');
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{letter.subject}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          {t('close')}
        </Button>
      </div>
      <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{letter.text}</pre>
    </section>
  );
}
