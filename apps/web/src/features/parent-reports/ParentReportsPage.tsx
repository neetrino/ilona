'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { AutoDismissToast, Button } from '@/shared/components/ui';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { fetchParentReports, previewParentReport, type ParentReportLetter } from './api';
import { ParentReportFilters, useParentReportFilters } from './ParentReportFilters';
import { ParentReportHistory } from './ParentReportHistory';
import { LetterPreview } from './LetterPreviewModal';
import { ParentReportSendDialog } from './ParentReportSendDialog';
import { ParentReportSummary } from './ParentReportSummary';
import { ParentReportTable } from './ParentReportTable';
import { canSendParentReport, filterParentReports, quarterMonthNumbers, summarizeParentReports } from './parent-report-range';
import { useParentReportSending } from './useParentReportSending';

export function ParentReportsPage() {
  const t = useTranslations('parentReportsPage');
  const tNav = useTranslations('nav');
  const { user } = useAuthStore();
  const filters = useParentReportFilters();
  const [quarterKey, setQuarterKey] = useState<string | undefined>();
  const query = useQuery({
    queryKey: ['parent-reports', quarterKey ?? 'current'],
    queryFn: () => fetchParentReports(quarterKey),
  });
  const activeQuarter = query.data?.quarterKey;
  const viewingCurrent = !query.data || activeQuarter === query.data.currentQuarterKey;
  const preview = useLetterPreview(activeQuarter);
  const sending = useParentReportSending(activeQuarter, preview.close);
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
  const summary = useMemo(() => summarizeParentReports(items), [items]);
  const sendableIds = shown.filter(canSendParentReport).map((item) => item.studentId);
  const previewItem = items.find((item) => item.studentId === preview.studentId);
  const cardBase = `${getAdminPortalBasePath(user?.role)}/students`;

  return (
    <DashboardLayout title={tNav('parentReports')} subtitle={t('subtitle')}>
      <div className="space-y-4">
        <ParentReportHistory
          history={query.data?.history ?? []}
          selected={activeQuarter}
          onSelect={(key) => {
            preview.close();
            setQuarterKey(key);
          }}
        />
        <ParentReportSummary summary={summary} readyLabel={viewingCurrent ? undefined : t('notSent')} />
        <ParentReportFilters items={items} filters={filters} />
        <ReportToolbar
          quarterKey={viewingCurrent ? activeQuarter : undefined}
          daysPassed={query.data?.daysPassed}
          daysLeft={query.data?.daysLeft}
          shown={shown.length}
          canSend={viewingCurrent && Boolean(activeQuarter) && sendableIds.length > 0 && !sending.sendAll.isPending}
          onSend={() => sending.setConfirmOpen(true)}
        />
        {viewingCurrent ? null : <p className="text-sm text-[#3b3b40]">{t('pastOnly')}</p>}
        {query.isError ? <p className="text-sm text-red-600">{t('loadError')}</p> : null}
        {preview.failed ? <p className="text-sm text-red-600">{t('previewFailed')}</p> : null}
        <ParentReportTable
          items={shown}
          loading={query.isLoading}
          noMatches={!query.isLoading && items.length > 0 && shown.length === 0}
          emptyLabel={viewingCurrent ? undefined : t('pastEmpty')}
          sendingId={sending.sendOne.isPending ? sending.sendOne.variables?.studentId : null}
          cardBase={cardBase}
          allowSend={viewingCurrent}
          onPreview={preview.open}
          onSend={(studentId) => sending.sendOne.mutate({ studentId })}
          onResend={(studentId) => sending.sendOne.mutate({ studentId, resend: true })}
        />
        {preview.visible ? (
          <LetterPreview
            letter={preview.letter}
            canSend={viewingCurrent && previewItem ? canSendParentReport(previewItem) : false}
            sending={sending.sendOne.isPending}
            onClose={preview.close}
            onSend={() => preview.studentId && sending.sendOne.mutate({ studentId: preview.studentId })}
          />
        ) : null}
        <ParentReportSendDialog
          open={sending.confirmOpen}
          count={sendableIds.length}
          pending={sending.sendAll.isPending}
          onOpenChange={sending.setConfirmOpen}
          onConfirm={() => sending.sendAll.mutate(sendableIds)}
        />
        {sending.notice ? (
          <AutoDismissToast
            key={sending.notice.key}
            message={sending.notice.message}
            variant={sending.notice.variant}
            onDismiss={sending.dismissNotice}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function useLetterPreview(quarterKey: string | undefined) {
  const [visible, setVisible] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [letter, setLetter] = useState<ParentReportLetter | null>(null);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  async function open(nextStudentId: string) {
    if (!quarterKey) return;
    const id = requestId.current + 1;
    requestId.current = id;
    setStudentId(nextStudentId);
    setVisible(true);
    setLetter(null);
    setFailed(false);
    try {
      const next = await previewParentReport(nextStudentId, quarterKey);
      if (requestId.current !== id) return;
      setLetter(next);
    } catch {
      if (requestId.current !== id) return;
      setVisible(false);
      setFailed(true);
    }
  }

  const close = useCallback(() => {
    requestId.current += 1;
    setVisible(false);
    setStudentId(null);
    setLetter(null);
  }, []);

  return { visible, studentId, letter, failed, open, close };
}

function ReportToolbar({
  quarterKey,
  daysPassed,
  daysLeft,
  shown,
  canSend,
  onSend,
}: {
  quarterKey: string | undefined;
  daysPassed: number | undefined;
  daysLeft: number | undefined;
  shown: number;
  canSend: boolean;
  onSend: () => void;
}) {
  const t = useTranslations('parentReportsPage');
  return (
    <div className="flex flex-wrap items-center gap-3">
      {quarterKey && daysPassed != null && daysLeft != null ? (
        <QuarterTiming quarterKey={quarterKey} daysPassed={daysPassed} daysLeft={daysLeft} />
      ) : null}
      <p className="text-sm text-slate-600">{t('rangeSummary', { shown })}</p>
      <Button type="button" className="h-11 min-h-11 gap-1.5 rounded-[15px]" disabled={!canSend} onClick={onSend}>
        <Send className="h-4 w-4" aria-hidden />
        {t('sendAll')}
      </Button>
    </div>
  );
}

function QuarterTiming({
  quarterKey,
  daysPassed,
  daysLeft,
}: {
  quarterKey: string;
  daysPassed: number;
  daysLeft: number;
}) {
  const t = useTranslations('parentReportsPage');
  const tCommon = useTranslations('common');
  const total = Math.max(daysPassed + daysLeft, 1);
  const percent = Math.min(100, Math.round((daysPassed / total) * 100));
  const ready = daysLeft === 0;
  return (
    <div className="min-w-[22rem] flex-1 rounded-[15px] border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3">
      <ul className="mb-2 flex flex-nowrap gap-2">
        {quarterMonthNumbers(quarterKey).map((month) => (
          <li key={month} className="rounded-full bg-[#ecefff] px-3 py-1 text-sm font-medium text-[#1010a3]">
            {tCommon(`months.${month}`)}
          </li>
        ))}
      </ul>
      <p className={`text-sm ${ready ? 'font-medium text-[#1010a3]' : 'text-[#3b3b40]'}`}>
        {ready ? t('sendToday') : t('quarterTiming', { passed: daysPassed, left: daysLeft })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ecefff]" aria-hidden>
        <div className="h-full rounded-full bg-[#1010a3]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
