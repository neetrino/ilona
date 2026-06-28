'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DailyPlan, DailyPlanResourceKind } from './types';
import { DailyPlanCard } from './DailyPlanCard';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

interface DailyPlanListSectionProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  createLabel: string;
  items: DailyPlan[];
  isLoading: boolean;
  emptyDefaultMessage: string;
  emptySearchMessage: (query: string) => string;
  onView: (plan: DailyPlan) => void;
  onEdit: (plan: DailyPlan) => void;
  onDelete?: (plan: DailyPlan) => Promise<void>;
  deletingPlanId?: string | null;
  deleteError?: string | null;
  showCreate?: boolean;
}

const MOBILE_PAGE_SIZE = 5;
const IPAD_PAGE_SIZE = 10;

export function DailyPlanListSection({
  search,
  onSearchChange,
  onCreate,
  createLabel,
  items,
  isLoading,
  emptyDefaultMessage,
  emptySearchMessage,
  onView,
  onEdit,
  onDelete,
  deletingPlanId = null,
  deleteError = null,
  showCreate = true,
}: DailyPlanListSectionProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const kindLabel = useMemo(
    (): Record<DailyPlanResourceKind, string> => ({
      READING: t('resourceKinds.READING'),
      LISTENING: t('resourceKinds.LISTENING'),
      WRITING: t('resourceKinds.WRITING'),
      SPEAKING: t('resourceKinds.SPEAKING'),
    }),
    [t],
  );
  const trimmedSearch = search.trim();
  const isDeletePending = deletingPlanId !== null;
  const isIPad = useIsIPad();
  const pageSize = isIPad ? IPAD_PAGE_SIZE : MOBILE_PAGE_SIZE;
  const [mobilePage, setMobilePage] = useState(0);
  const cardsStartRef = useRef<HTMLDivElement | null>(null);
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
  }, [trimmedSearch, items.length]);

  const goToMobilePage = (nextPage: number) => {
    setMobilePage(nextPage);
    requestAnimationFrame(() => {
      cardsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-11 pl-10 pr-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
        </div>
        {showCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="h-11 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {createLabel}
        </button>
        )}
      </div>
      {deleteError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {deleteError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-40 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          {trimmedSearch ? emptySearchMessage(trimmedSearch) : emptyDefaultMessage}
        </div>
      ) : (
        <div className="space-y-4">
          <div ref={cardsStartRef} className="md:hidden" />
          <div className="grid grid-cols-1 gap-4 md:hidden">
          {mobileItems.map((plan) => (
            <DailyPlanCard
              key={plan.id}
              plan={plan}
              kindLabel={kindLabel}
              onView={() => onView(plan)}
              onEdit={() => onEdit(plan)}
              onDelete={onDelete ? () => onDelete(plan) : undefined}
              isDeletePending={isDeletePending}
            />
          ))}
          </div>
          <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2">
            {items.map((plan) => (
              <DailyPlanCard
                key={`desktop-${plan.id}`}
                plan={plan}
                kindLabel={kindLabel}
                onView={() => onView(plan)}
                onEdit={() => onEdit(plan)}
                onDelete={onDelete ? () => onDelete(plan) : undefined}
                isDeletePending={isDeletePending}
              />
            ))}
          </div>
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
                  aria-label={tCommon('previousPage')}
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
                  aria-label={tCommon('nextPage')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
