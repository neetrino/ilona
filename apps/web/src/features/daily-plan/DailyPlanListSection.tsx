'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { DailyPlan, DailyPlanResourceKind } from './types';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

const KIND_LABEL: Record<DailyPlanResourceKind, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
}

function teacherName(plan: DailyPlan): string {
  return `${plan.teacher.user.firstName} ${plan.teacher.user.lastName}`;
}

function centerName(plan: DailyPlan): string | null {
  return plan.group?.center?.name ?? plan.lesson?.group?.center?.name ?? null;
}

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
            placeholder="Search topics, titles, descriptions..."
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
            <article
              key={plan.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => onView(plan)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onView(plan);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    {formatDate(plan.date)}
                  </div>
                  <div className="font-semibold text-[#1010a3]">
                    {teacherName(plan)}
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    {plan.group?.name ?? 'No group'}{' '}
                    {plan.group?.level && (
                      <span className="text-slate-500 font-normal">
                        · {plan.group.level}
                      </span>
                    )}
                  </div>
                  {centerName(plan) && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {centerName(plan)}
                    </div>
                  )}
                  {plan.lesson && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Linked to lesson · {formatDate(plan.lesson.scheduledAt)}
                    </div>
                  )}
                </div>
                {plan.canEdit && (
                <div className="flex items-start gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(plan);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary hover:bg-primary/10 disabled:opacity-60"
                    aria-label="Edit daily plan"
                    title="Edit"
                    disabled={isDeletePending}
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={async (event) => {
                        event.stopPropagation();
                        if (isDeletePending) {
                          return;
                        }
                        if (confirm('Delete this daily plan? This cannot be undone.')) {
                          await onDelete(plan);
                        }
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Delete daily plan"
                      title="Delete"
                      disabled={isDeletePending}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                )}
              </header>
              <ul className="space-y-2">
                {plan.topics.map((topic) => (
                  <li
                    key={topic.id}
                    className="border border-slate-100 rounded-md px-3 py-2 bg-slate-50"
                  >
                    <div className="text-sm font-medium text-[#1010a3]">
                      {topic.title}
                    </div>
                    {topic.resources.length > 0 && (
                      <ul className="mt-1 text-xs text-slate-600 space-y-0.5">
                        {topic.resources.map((resource) => (
                          <li key={resource.id} className="flex gap-1">
                            <span className="w-16 shrink-0 font-medium text-[#1010a3]">
                              {KIND_LABEL[resource.kind]}
                            </span>
                            <span className="truncate">
                              {resource.link ? (
                                <a
                                  href={resource.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {resource.title}
                                </a>
                              ) : (
                                resource.title
                              )}
                              {resource.description && (
                                <span className="text-slate-400">
                                  {' '}
                                  — {resource.description}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
          </div>
          <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2">
            {items.map((plan) => (
              <article
                key={`desktop-${plan.id}`}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => onView(plan)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onView(plan);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      {formatDate(plan.date)}
                    </div>
                    <div className="font-semibold text-[#1010a3]">
                      {teacherName(plan)}
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      {plan.group?.name ?? 'No group'}{' '}
                      {plan.group?.level && (
                        <span className="text-slate-500 font-normal">
                          · {plan.group.level}
                        </span>
                      )}
                    </div>
                    {centerName(plan) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {centerName(plan)}
                      </div>
                    )}
                    {plan.lesson && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Linked to lesson · {formatDate(plan.lesson.scheduledAt)}
                      </div>
                    )}
                  </div>
                  {plan.canEdit && (
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(plan);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary hover:bg-primary/10 disabled:opacity-60"
                      aria-label="Edit daily plan"
                      title="Edit"
                      disabled={isDeletePending}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (isDeletePending) {
                            return;
                          }
                          if (confirm('Delete this daily plan? This cannot be undone.')) {
                            await onDelete(plan);
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Delete daily plan"
                        title="Delete"
                        disabled={isDeletePending}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  )}
                </header>
                <ul className="space-y-2">
                  {plan.topics.map((topic) => (
                    <li
                      key={topic.id}
                      className="border border-slate-100 rounded-md px-3 py-2 bg-slate-50"
                    >
                      <div className="text-sm font-medium text-[#1010a3]">
                        {topic.title}
                      </div>
                      {topic.resources.length > 0 && (
                        <ul className="mt-1 text-xs text-slate-600 space-y-0.5">
                          {topic.resources.map((resource) => (
                            <li key={resource.id} className="flex gap-1">
                              <span className="w-16 shrink-0 font-medium text-[#1010a3]">
                                {KIND_LABEL[resource.kind]}
                              </span>
                              <span className="truncate">
                                {resource.link ? (
                                  <a
                                    href={resource.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {resource.title}
                                  </a>
                                ) : (
                                  resource.title
                                )}
                                {resource.description && (
                                  <span className="text-slate-400">
                                    {' '}
                                    — {resource.description}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
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
      )}
    </div>
  );
}
