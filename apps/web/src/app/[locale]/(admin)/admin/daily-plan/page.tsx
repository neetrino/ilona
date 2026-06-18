'use client';

import { cn } from '@/shared/lib/utils';
import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { DatePickerInput } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCenters } from '@/features/centers';
import { useTeachers } from '@/features/teachers';
import { useDailyPlans } from '@/features/daily-plan';
import type { DailyPlan } from '@/features/daily-plan/types';
import { DailyPlanViewer } from '@/features/daily-plan/DailyPlanViewer';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

function defaultDateRangeStrings(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: ymd(from), to: ymd(to) };
}

function toStartIso(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

function toEndIso(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

function centerLabel(plan: DailyPlan): string {
  return (
    plan.group?.center?.name ?? plan.lesson?.group?.center?.name ?? '—'
  );
}

function contentSummary(plan: DailyPlan, t: ReturnType<typeof useTranslations<'dailyPlanPage'>>): string {
  const n = plan.topics.length;
  if (n === 0) {
    return t('noTopics');
  }
  if (n === 1) {
    return plan.topics[0]?.title ?? t('oneTopic');
  }
  return `${t('topicsCount', { count: n })} · ${plan.topics[0]?.title ?? ''}`.trim();
}

function formatPlanDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
}

function formatLessonSchedule(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MOBILE_PAGE_SIZE = 5;
const IPAD_PAGE_SIZE = 10;

export default function AdminDailyPlanPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();
  const managerCenterId =
    user?.role === 'MANAGER' ? user.managerCenterId : undefined;
  const managerMissingCenter =
    user?.role === 'MANAGER' && !managerCenterId;

  const initialRange = useMemo(() => defaultDateRangeStrings(), []);
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [search, setSearch] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [viewing, setViewing] = useState<DailyPlan | null>(null);
  const isIPad = useIsIPad();
  const pageSize = isIPad ? IPAD_PAGE_SIZE : MOBILE_PAGE_SIZE;
  const [mobilePage, setMobilePage] = useState(0);
  const cardsStartRef = useRef<HTMLDivElement | null>(null);

  const { data: centersData } = useCenters({ isActive: true });
  const allCenters = useMemo(
    () => centersData?.items ?? [],
    [centersData?.items],
  );
  const managerBranchName = useMemo(() => {
    if (user?.role !== 'MANAGER' || !managerCenterId) {
      return null;
    }
    return allCenters.find((c) => c.id === managerCenterId)?.name ?? null;
  }, [allCenters, managerCenterId, user?.role]);

  const { data: teachersData } = useTeachers(
    { take: 200 },
    !managerMissingCenter,
  );
  const teachers = useMemo(
    () => teachersData?.items ?? [],
    [teachersData?.items],
  );

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      teacherId: teacherId || undefined,
      dateFrom: dateFrom ? toStartIso(dateFrom) : undefined,
      dateTo: dateTo ? toEndIso(dateTo) : undefined,
      take: 200,
      skip: 0,
    }),
    [dateFrom, dateTo, search, teacherId],
  );

  const { data, isLoading, isError, error } = useDailyPlans(
    filters,
    !managerMissingCenter,
  );
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(mobilePage, totalPages - 1);
  const mobileItems = useMemo(
    () =>
      items.slice(
        safePage * pageSize,
        safePage * pageSize + pageSize,
      ),
    [items, safePage, pageSize],
  );

  useEffect(() => {
    setMobilePage(0);
  }, [search, teacherId, dateFrom, dateTo, items.length]);

  const goToMobilePage = (nextPage: number) => {
    setMobilePage(nextPage);
    requestAnimationFrame(() => {
      cardsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const subtitle = managerMissingCenter
    ? t('subtitleNoBranch')
    : user?.role === 'MANAGER' && managerBranchName
      ? t('subtitleManager', { branch: managerBranchName })
      : t('subtitleAll');

  const renderPlanCard = (plan: DailyPlan, keyPrefix = '') => {
    const name = `${plan.teacher.user.firstName} ${plan.teacher.user.lastName}`;
    const lessonAt = plan.lesson?.scheduledAt
      ? formatLessonSchedule(plan.lesson.scheduledAt)
      : null;
    return (
      <li key={`${keyPrefix}${plan.id}`}>
        <button
          type="button"
          onClick={() => setViewing(plan)}
          className={cn(
            'flex h-full w-full flex-col rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 text-left shadow-sm transition hover:border-[#1010a3]/40 hover:shadow-md',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1010a3]">{name}</p>
              <p className="text-xs text-[#8b8b90] mt-0.5">
                {centerLabel(plan)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f0f0fc] px-2.5 py-0.5 text-xs font-medium text-[#1010a3]">
              {formatPlanDate(plan.date)}
            </span>
          </div>
          {lessonAt && (
            <p className="mt-2 text-xs text-[#8b8b90]">
              {t('lessonPrefix')} · {lessonAt}
            </p>
          )}
          <p className="mt-3 text-sm text-[#3b3b40] line-clamp-2">
            {plan.group?.name && (
              <span className="font-medium text-[#3b3b40]">
                {plan.group.name}
                {' · '}
              </span>
            )}
            {!plan.group?.name && plan.lesson?.group?.name && (
              <span className="font-medium text-[#3b3b40]">
                {plan.lesson.group.name}
                {' · '}
              </span>
            )}
            {contentSummary(plan, t)}
          </p>
          <span className="mt-4 text-xs font-medium text-[#1010a3]">
            {t('viewDetails')}
          </span>
        </button>
      </li>
    );
  };

  return (
    <DashboardLayout title={tNav('dailyPlan')} subtitle={subtitle}>
      <div className={cn(portalPageStackClass, 'max-w-7xl mx-auto w-full')}>
        {managerMissingCenter && (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-10 text-center sm:px-8"
            role="alert"
          >
            <p className="font-semibold text-amber-900">{t('noBranchTitle')}</p>
            <p className="mt-2 text-sm text-amber-800 max-w-lg mx-auto">
              {t('noBranchDescription')}
            </p>
          </div>
        )}

        {!managerMissingCenter && (
        <div className="flex flex-col gap-4 rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 sm:p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[#3b3b40]">{tCommon('from')}</span>
              <DatePickerInput
                value={dateFrom}
                onValueChange={setDateFrom}
                className="h-10 rounded-lg border border-[rgba(14,14,16,0.07)] px-3 text-[#3b3b40]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[#3b3b40]">{tCommon('to')}</span>
              <DatePickerInput
                value={dateTo}
                onValueChange={setDateTo}
                className="h-10 rounded-lg border border-[rgba(14,14,16,0.07)] px-3 text-[#3b3b40]"
              />
            </label>
            <div className="col-span-2 flex flex-col gap-1 text-sm lg:col-span-2">
              <span className="font-medium text-[#3b3b40]">{tCommon('teacher')}</span>
              <SingleSelectDropdown
                id="daily-plan-teacher-filter"
                options={[
                  { id: '', label: t('allTeachers') },
                  ...teachers.map((teacher) => ({
                    id: teacher.id,
                    label: `${teacher.user.firstName} ${teacher.user.lastName}`,
                  })),
                ]}
                value={teacherId}
                onValueChange={(nextValue) => setTeacherId(nextValue ?? '')}
              />
            </div>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[#3b3b40]">{tCommon('search')}</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-10 w-full rounded-lg border border-[rgba(14,14,16,0.07)] px-3 text-[#3b3b40]"
            />
          </label>
        </div>
        )}

        {!managerMissingCenter && isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error instanceof Error ? error.message : t('loadError')}
          </div>
        )}

        {!managerMissingCenter && isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1010a3] border-t-transparent" />
          </div>
        ) : !managerMissingCenter && items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgba(14,14,16,0.07)] bg-white px-6 py-14 text-center text-[#3b3b40]">
            {t('empty')}
          </div>
        ) : !managerMissingCenter ? (
          <div className="space-y-4">
            <div ref={cardsStartRef} className="md:hidden" />
            <ul className="grid w-full min-w-0 grid-cols-1 gap-4 md:hidden">
              {mobileItems.map((plan) => renderPlanCard(plan, 'mobile-'))}
            </ul>
            <ul className="hidden w-full min-w-0 grid-cols-1 gap-4 md:grid md:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))]">
              {items.map((plan) => renderPlanCard(plan, 'desktop-'))}
            </ul>
            {items.length > pageSize && (
              <div className="flex items-center justify-between text-sm text-[#8b8b90] md:hidden">
                <span>
                  {safePage * pageSize + 1}-
                  {Math.min((safePage + 1) * pageSize, items.length)} / {items.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      safePage === 0
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                    }`}
                    disabled={safePage === 0}
                    onClick={() => goToMobilePage(Math.max(0, safePage - 1))}
                    aria-label="Previous page"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                    {safePage + 1}
                  </span>
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      safePage >= totalPages - 1
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                    }`}
                    disabled={safePage >= totalPages - 1}
                    onClick={() => goToMobilePage(Math.min(totalPages - 1, safePage + 1))}
                    aria-label="Next page"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {!managerMissingCenter && data && data.total > data.take && (
          <p className="text-center text-sm text-[#8b8b90]">
            {t('showingPartial', { shown: items.length, total: data.total })}
          </p>
        )}
      </div>

      {viewing && (
        <DailyPlanViewer plan={viewing} onClose={() => setViewing(null)} />
      )}
    </DashboardLayout>
  );
}
