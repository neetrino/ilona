'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { DailyPlan, DailyPlanResourceKind } from './types';

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
}: DailyPlanListSectionProps) {
  const trimmedSearch = search.trim();
  const isDeletePending = deletingPlanId !== null;

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
        <button
          type="button"
          onClick={onCreate}
          className="h-11 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {createLabel}
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((plan) => (
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
                  <div className="font-semibold text-slate-800">
                    {plan.group?.name ?? 'No group'}{' '}
                    {plan.group?.level && (
                      <span className="text-slate-500 font-normal">
                        · {plan.group.level}
                      </span>
                    )}
                  </div>
                  {plan.lesson && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Linked to lesson · {formatDate(plan.lesson.scheduledAt)}
                    </div>
                  )}
                </div>
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
              </header>
              <ul className="space-y-2">
                {plan.topics.map((topic) => (
                  <li
                    key={topic.id}
                    className="border border-slate-100 rounded-md px-3 py-2 bg-slate-50"
                  >
                    <div className="font-medium text-slate-700 text-sm">
                      {topic.title}
                    </div>
                    {topic.resources.length > 0 && (
                      <ul className="mt-1 text-xs text-slate-600 space-y-0.5">
                        {topic.resources.map((resource) => (
                          <li key={resource.id} className="flex gap-1">
                            <span className="text-slate-400 w-16 shrink-0">
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
      )}
    </div>
  );
}
