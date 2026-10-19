'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui/button';
import {
  fetchParentReports,
  previewParentReport,
  sendParentQuarter,
  sendParentReport,
  type ParentReportLetter,
} from './api';
import { ParentReportFilters, useParentReportFilters } from './ParentReportFilters';
import { LetterPreview } from './LetterPreviewModal';
import { ParentReportTable } from './ParentReportTable';
import { canSendParentReport, filterParentReports, quartersInRange } from './parent-report-range';

export function ParentReportsPage() {
  const t = useTranslations('parentReportsPage');
  const tNav = useTranslations('nav');
  const filters = useParentReportFilters();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['parent-reports'],
    queryFn: () => fetchParentReports(),
  });
  const activeQuarter = query.data?.quarterKey;
  const preview = useLetterPreview(activeQuarter);
  const items = query.data?.items ?? [];
  const shown = useMemo(
    () =>
      filterParentReports(items, {
        groupIds: filters.groupIds,
        statusIds: filters.statusIds,
        search: filters.search,
      }),
    [items, filters.groupIds, filters.statusIds, filters.search],
  );
  const rangeQuarters = quartersInRange(filters.fromQuarter, filters.toQuarter).length;
  const sendableIds = shown.filter(canSendParentReport).map((item) => item.studentId);
  const sendOne = useMutation({
    mutationFn: (studentId: string) => sendParentReport(studentId, activeQuarter ?? ''),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['parent-reports'] }),
  });
  const sendAll = useMutation({
    mutationFn: (studentIds: string[]) => sendParentQuarter(activeQuarter ?? '', studentIds),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['parent-reports'] }),
  });

  return (
    <DashboardLayout title={tNav('parentReports')} subtitle={t('subtitle')}>
      <div className="space-y-4">
        <ParentReportFilters items={items} filters={filters} />
        <ReportToolbar
          daysPassed={query.data?.daysPassed}
          daysLeft={query.data?.daysLeft}
          shown={shown.length}
          quarters={rangeQuarters}
          canSend={Boolean(activeQuarter) && sendableIds.length > 0 && !sendAll.isPending}
          onSend={() => sendAll.mutate(sendableIds)}
        />
        {query.isError ? <p className="text-sm text-red-600">{t('loadError')}</p> : null}
        {sendAll.isError || sendOne.isError ? <p className="text-sm text-red-600">{t('sendFailed')}</p> : null}
        {preview.failed ? <p className="text-sm text-red-600">{t('previewFailed')}</p> : null}
        <ParentReportTable
          items={shown}
          loading={query.isLoading}
          noMatches={!query.isLoading && items.length > 0 && shown.length === 0}
          fromQuarter={filters.fromQuarter}
          toQuarter={filters.toQuarter}
          sendingId={sendOne.isPending ? sendOne.variables : null}
          onPreview={preview.open}
          onSend={(studentId) => sendOne.mutate(studentId)}
        />
        {preview.visible ? <LetterPreview letter={preview.letter} onClose={preview.close} /> : null}
      </div>
    </DashboardLayout>
  );
}

function useLetterPreview(quarterKey: string | undefined) {
  const [visible, setVisible] = useState(false);
  const [letter, setLetter] = useState<ParentReportLetter | null>(null);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  async function open(studentId: string) {
    if (!quarterKey) return;
    const id = requestId.current + 1;
    requestId.current = id;
    setVisible(true);
    setLetter(null);
    setFailed(false);
    try {
      const next = await previewParentReport(studentId, quarterKey);
      if (requestId.current !== id) return;
      setLetter(next);
    } catch {
      if (requestId.current !== id) return;
      setVisible(false);
      setFailed(true);
    }
  }

  function close() {
    requestId.current += 1;
    setVisible(false);
    setLetter(null);
  }

  return { visible, letter, failed, open, close };
}

function ReportToolbar({
  daysPassed,
  daysLeft,
  shown,
  quarters,
  canSend,
  onSend,
}: {
  daysPassed: number | undefined;
  daysLeft: number | undefined;
  shown: number;
  quarters: number;
  canSend: boolean;
  onSend: () => void;
}) {
  const t = useTranslations('parentReportsPage');
  return (
    <div className="flex flex-wrap items-center gap-3">
      {daysPassed != null && daysLeft != null ? <QuarterTiming daysPassed={daysPassed} daysLeft={daysLeft} /> : null}
      <p className="text-sm text-slate-600">{t('rangeSummary', { shown, quarters })}</p>
      <Button type="button" className="h-11 min-h-11 rounded-[15px]" disabled={!canSend} onClick={onSend}>
        {t('sendAll')}
      </Button>
    </div>
  );
}

function QuarterTiming({ daysPassed, daysLeft }: { daysPassed: number; daysLeft: number }) {
  const t = useTranslations('parentReportsPage');
  const total = Math.max(daysPassed + daysLeft, 1);
  const percent = Math.min(100, Math.round((daysPassed / total) * 100));
  const ready = daysLeft === 0;
  return (
    <div className="min-w-[16rem] flex-1 rounded-[15px] border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3">
      <p className={`text-sm ${ready ? 'font-medium text-[#1010a3]' : 'text-[#3b3b40]'}`}>
        {ready ? t('sendToday') : t('quarterTiming', { passed: daysPassed, left: daysLeft })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ecefff]" aria-hidden>
        <div className="h-full rounded-full bg-[#1010a3]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
