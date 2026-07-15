'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DailyPlan, DailyPlanResourceKind } from './types';
import { DailyPlanCardsGrid } from './DailyPlanCardsGrid';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import {
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SEARCH_INPUT_CLASS,
} from '@/shared/lib/admin-control-theme';
import { AdminPaginationControls } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

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
  /** When set, list is split into My / Others (or All if My is hidden). */
  currentUserId?: string | null;
  /** Teacher pages always show My section even when empty. */
  alwaysShowMineSection?: boolean;
}

const MOBILE_PAGE_SIZE = 5;
const IPAD_PAGE_SIZE = 10;

function slicePage(items: DailyPlan[], page: number, pageSize: number): DailyPlan[] {
  return items.slice(page * pageSize, page * pageSize + pageSize);
}

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
  currentUserId = null,
  alwaysShowMineSection = false,
}: DailyPlanListSectionProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const kindLabel = useMemo(
    (): Record<DailyPlanResourceKind, string> => ({
      READING: t('resourceKinds.READING'),
      LISTENING: t('resourceKinds.LISTENING'),
      WRITING: t('resourceKinds.WRITING'),
      SPEAKING: t('resourceKinds.SPEAKING'),
      GRAMMAR: t('resourceKinds.GRAMMAR'),
      CHALLENGE: t('resourceKinds.CHALLENGE'),
    }),
    [t],
  );
  const trimmedSearch = search.trim();
  const isDeletePending = deletingPlanId !== null;
  const isIPad = useIsIPad();
  const pageSize = isIPad ? IPAD_PAGE_SIZE : MOBILE_PAGE_SIZE;
  const [mobilePage, setMobilePage] = useState(0);
  const cardsStartRef = useRef<HTMLDivElement | null>(null);

  const { mine, others, showMineSection } = useMemo(() => {
    if (!currentUserId) {
      return { mine: [] as DailyPlan[], others: items, showMineSection: false };
    }
    const own: DailyPlan[] = [];
    const rest: DailyPlan[] = [];
    for (const plan of items) {
      if (plan.teacher.user.id === currentUserId) {
        own.push(plan);
      } else {
        rest.push(plan);
      }
    }
    return {
      mine: own,
      others: rest,
      showMineSection: alwaysShowMineSection || own.length > 0,
    };
  }, [alwaysShowMineSection, currentUserId, items]);

  const activeItems = showMineSection ? others : items;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / pageSize));
  const safePage = Math.min(mobilePage, totalPages - 1);
  const mobileActiveItems = useMemo(
    () => slicePage(activeItems, safePage, pageSize),
    [activeItems, safePage, pageSize],
  );
  const mobileMineItems = useMemo(
    () => slicePage(mine, 0, pageSize),
    [mine, pageSize],
  );

  useEffect(() => {
    setMobilePage(0);
  }, [trimmedSearch, items.length, showMineSection]);

  const goToMobilePage = (nextPage: number) => {
    setMobilePage(nextPage);
    requestAnimationFrame(() => {
      cardsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const emptyMessage = trimmedSearch
    ? emptySearchMessage(trimmedSearch)
    : emptyDefaultMessage;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className={ADMIN_SEARCH_INPUT_CLASS}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90]"
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
            className={cn(
              ADMIN_PRIMARY_BUTTON_CLASS,
              'shrink-0 bg-[#1010a3] text-white transition-colors hover:bg-[#1010a3]/90',
            )}
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
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-8">
          {showMineSection && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#111827]">{t('sectionMine')}</h2>
              {mine.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                  {emptyMessage}
                </div>
              ) : (
                <DailyPlanCardsGrid
                  items={mine}
                  mobileItems={mobileMineItems}
                  kindLabel={kindLabel}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeletePending={isDeletePending}
                />
              )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#111827]">
              {showMineSection ? t('sectionOthers') : t('sectionAll')}
            </h2>
            {activeItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              <>
                <DailyPlanCardsGrid
                  items={activeItems}
                  mobileItems={mobileActiveItems}
                  kindLabel={kindLabel}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeletePending={isDeletePending}
                  cardsStartRef={cardsStartRef}
                />
                {activeItems.length > pageSize && (
                  <div className="flex items-center justify-center md:hidden">
                    <AdminPaginationControls
                      page={safePage}
                      totalPages={totalPages}
                      onPageChange={goToMobilePage}
                      previousLabel={tCommon('previousPage')}
                      nextLabel={tCommon('nextPage')}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
