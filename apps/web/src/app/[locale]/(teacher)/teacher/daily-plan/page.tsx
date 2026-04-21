'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useDailyPlans, useDeleteDailyPlan } from '@/features/daily-plan';
import type {
  DailyPlan,
  DailyPlanResourceKind,
} from '@/features/daily-plan/types';
import { DailyPlanEditor } from '@/features/daily-plan/DailyPlanEditor';

const KIND_LABEL: Record<DailyPlanResourceKind, string> = {
  READING: 'Reading',
  LISTENING: 'Listening',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
}

export default function TeacherDailyPlanPage() {
  const t = useTranslations('nav');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<DailyPlan | null>(null);
  const [creating, setCreating] = useState(false);

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, take: 100 }),
    [search],
  );
  const { data, isLoading, refetch } = useDailyPlans(filters);
  const items = data?.items ?? [];
  const remove = useDeleteDailyPlan();

  return (
    <DashboardLayout
      title={t('dailyPlan')}
      subtitle="Plan topics, skills and resources for each lesson"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics, titles, descriptions…"
            className="w-full h-11 pl-10 pr-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-11 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          + New Daily Plan
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-40 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          {search.trim()
            ? `No daily plans match "${search.trim()}".`
            : 'No daily plans yet. Create one to get started.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((plan) => (
            <article
              key={plan.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3"
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(plan)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        confirm('Delete this daily plan? This cannot be undone.')
                      ) {
                        await remove.mutateAsync(plan.id);
                        refetch();
                      }
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
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
                        {topic.resources.map((res) => (
                          <li key={res.id} className="flex gap-1">
                            <span className="text-slate-400 w-16 shrink-0">
                              {KIND_LABEL[res.kind]}
                            </span>
                            <span className="truncate">
                              {res.link ? (
                                <a
                                  href={res.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {res.title}
                                </a>
                              ) : (
                                res.title
                              )}
                              {res.description && (
                                <span className="text-slate-400">
                                  {' '}
                                  — {res.description}
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

      {(creating || editing) && (
        <DailyPlanEditor
          mode={creating ? 'create' : 'edit'}
          plan={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refetch();
          }}
        />
      )}
    </DashboardLayout>
  );
}
