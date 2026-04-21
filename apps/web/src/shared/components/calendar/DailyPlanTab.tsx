'use client';

import { useMemo, useState } from 'react';
import { DailyPlanEditor, useDailyPlans } from '@/features/daily-plan';

interface DailyPlanTabProps {
  lessonId: string;
}

export function DailyPlanTab({ lessonId }: DailyPlanTabProps) {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      lessonId,
      search: search.trim() || undefined,
      take: 50,
    }),
    [lessonId, search],
  );

  const { data, isLoading, refetch } = useDailyPlans(filters);
  const plans = data?.items ?? [];
  const editingPlan = plans.find((plan) => plan.id === editingId);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search topics, titles, skills..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="h-10 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          + Daily Plan
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Loading daily plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          No daily plans for this lesson.
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(plan.date).toLocaleDateString()} · {plan.group?.name ?? 'No group'}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingId(plan.id)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Edit
                </button>
              </div>
              <ul className="space-y-1 text-sm text-slate-600">
                {plan.topics.map((topic) => (
                  <li key={topic.id}>• {topic.title}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}

      {(isCreating || editingPlan) && (
        <DailyPlanEditor
          mode={isCreating ? 'create' : 'edit'}
          plan={editingPlan}
          onClose={() => {
            setIsCreating(false);
            setEditingId(null);
          }}
          onSaved={() => {
            setIsCreating(false);
            setEditingId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
