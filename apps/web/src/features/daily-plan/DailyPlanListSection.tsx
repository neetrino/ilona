'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DailyPlan, DailyPlanResourceKind } from './types';
import { DailyPlanCardsGrid } from './DailyPlanCardsGrid';
import {
  DailyPlanListFilters,
  type DailyPlanGroupOption,
  type DailyPlanTeacherOption,
} from './DailyPlanListFilters';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import { isDatePickerEventTarget } from '@/shared/components/ui/date-picker-input/date-picker-input.util';
import { SINGLE_SELECT_DROPDOWN_MENU_ATTR } from '@/shared/components/ui/single-select-dropdown/single-select-dropdown.constants';
import {
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SEARCH_INPUT_CLASS,
} from '@/shared/lib/admin-control-theme';
import { AdminPaginationControls } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

interface DailyPlanListSectionProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** When true, focusing search opens teacher/group/date filters. */
  enableStructuredFilters?: boolean;
  selectedTeacherIds?: Set<string>;
  onTeacherIdsChange?: (value: Set<string>) => void;
  selectedGroupIds?: Set<string>;
  onGroupIdsChange?: (value: Set<string>) => void;
  dateFrom?: string;
  onDateFromChange?: (value: string) => void;
  dateTo?: string;
  onDateToChange?: (value: string) => void;
  teacherOptions?: DailyPlanTeacherOption[];
  groupOptions?: DailyPlanGroupOption[];
  isLoadingTeachers?: boolean;
  isLoadingGroups?: boolean;
  /** True when teacher/group selection is a subset (not “all”). */
  hasPartialTeacherFilter?: boolean;
  hasPartialGroupFilter?: boolean;
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

function isFilterPortalTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (isDatePickerEventTarget(target)) return true;
  return Boolean(target.closest(`[${SINGLE_SELECT_DROPDOWN_MENU_ATTR}]`));
}

export function DailyPlanListSection({
  search,
  onSearchChange,
  enableStructuredFilters = false,
  selectedTeacherIds = new Set(),
  onTeacherIdsChange,
  selectedGroupIds = new Set(),
  onGroupIdsChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  teacherOptions = [],
  groupOptions = [],
  isLoadingTeachers = false,
  isLoadingGroups = false,
  hasPartialTeacherFilter = false,
  hasPartialGroupFilter = false,
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
  const hasStructuredFilters = Boolean(
    hasPartialTeacherFilter || hasPartialGroupFilter || dateFrom || dateTo,
  );
  const hasAnyFilters = Boolean(trimmedSearch || hasStructuredFilters);
  const isDeletePending = deletingPlanId !== null;
  const isIPad = useIsIPad();
  const pageSize = isIPad ? IPAD_PAGE_SIZE : MOBILE_PAGE_SIZE;
  const [mobilePage, setMobilePage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const cardsStartRef = useRef<HTMLDivElement | null>(null);
  const searchFiltersRef = useRef<HTMLDivElement | null>(null);

  const showFilters =
    enableStructuredFilters && (filtersOpen || hasStructuredFilters);

  const closeFiltersIfIdle = useCallback(() => {
    if (!hasStructuredFilters) {
      setFiltersOpen(false);
    }
  }, [hasStructuredFilters]);

  useOutsidePress(
    searchFiltersRef,
    (event) => {
      if (isFilterPortalTarget(event.target)) return;
      closeFiltersIfIdle();
    },
    { enabled: showFilters },
  );

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
  }, [
    trimmedSearch,
    hasPartialTeacherFilter,
    hasPartialGroupFilter,
    selectedTeacherIds.size,
    selectedGroupIds.size,
    dateFrom,
    dateTo,
    items.length,
    showMineSection,
  ]);

  const goToMobilePage = (nextPage: number) => {
    setMobilePage(nextPage);
    requestAnimationFrame(() => {
      cardsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const emptyMessage = hasAnyFilters
    ? trimmedSearch
      ? emptySearchMessage(trimmedSearch)
      : t('empty')
    : emptyDefaultMessage;

  const clearStructuredFilters = () => {
    onTeacherIdsChange?.(new Set(teacherOptions.map((teacher) => teacher.id)));
    onGroupIdsChange?.(new Set(groupOptions.map((group) => group.id)));
    onDateFromChange?.('');
    onDateToChange?.('');
  };

  const openStructuredFilters = () => {
    if (enableStructuredFilters) {
      setFiltersOpen(true);
    }
  };

  const toggleStructuredFilters = () => {
    if (!enableStructuredFilters) return;
    if (showFilters && !hasStructuredFilters) {
      setFiltersOpen(false);
      return;
    }
    setFiltersOpen(true);
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'flex flex-col gap-3 md:flex-row',
          enableStructuredFilters ? 'md:items-start' : 'md:items-center',
        )}
      >
        <div ref={searchFiltersRef} className="flex-1 space-y-3">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onFocus={openStructuredFilters}
              onClick={openStructuredFilters}
              placeholder={t('searchPlaceholder')}
              className={cn(
                ADMIN_SEARCH_INPUT_CLASS,
                enableStructuredFilters && 'pr-11',
              )}
            />
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8b90]"
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
            {enableStructuredFilters ? (
              <button
                type="button"
                onClick={toggleStructuredFilters}
                className={cn(
                  'absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[10px] transition-colors',
                  showFilters || hasStructuredFilters
                    ? 'bg-[#1010a3]/10 text-[#1010a3]'
                    : 'text-[#8b8b90] hover:bg-[#f5f5f7] hover:text-[#3b3b40]',
                )}
                aria-label={t('openFilters')}
                aria-expanded={showFilters}
                aria-controls="daily-plan-search-filters"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h18M6 12h12M10 20h4"
                  />
                </svg>
                {hasStructuredFilters ? (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#1010a3]" />
                ) : null}
              </button>
            ) : null}
          </div>
          {showFilters &&
          onTeacherIdsChange &&
          onGroupIdsChange &&
          onDateFromChange &&
          onDateToChange ? (
            <div id="daily-plan-search-filters">
              <DailyPlanListFilters
                selectedTeacherIds={selectedTeacherIds}
                onTeacherIdsChange={onTeacherIdsChange}
                selectedGroupIds={selectedGroupIds}
                onGroupIdsChange={onGroupIdsChange}
                dateFrom={dateFrom}
                onDateFromChange={onDateFromChange}
                dateTo={dateTo}
                onDateToChange={onDateToChange}
                teacherOptions={teacherOptions}
                groupOptions={groupOptions}
                isLoadingTeachers={isLoadingTeachers}
                isLoadingGroups={isLoadingGroups}
                onClear={clearStructuredFilters}
                hasActiveFilters={hasStructuredFilters}
              />
            </div>
          ) : null}
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

      {isLoading && items.length === 0 ? (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="min-h-[20rem] animate-pulse rounded-2xl bg-slate-100" />
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
