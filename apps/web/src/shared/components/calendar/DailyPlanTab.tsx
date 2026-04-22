'use client';

import { useMemo, useState } from 'react';
import { DailyPlanEditor, useDailyPlans } from '@/features/daily-plan';
import { Pencil } from 'lucide-react';

interface DailyPlanTabProps {
  lessonId: string;
  groupId?: string;
}

export function DailyPlanTab({ lessonId, groupId }: DailyPlanTabProps) {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

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
  const viewingPlan = plans.find((plan) => plan.id === viewingId);

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
            <article
              key={plan.id}
              className="rounded-lg border border-slate-200 bg-white p-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setViewingId(plan.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setViewingId(plan.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(plan.date).toLocaleDateString()} · {plan.group?.name ?? 'No group'}
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingId(plan.id);
                  }}
                  className="mt-5 text-primary hover:opacity-80"
                  aria-label="Edit daily plan"
                  title="Edit"
                >
                  <Pencil className="h-6 w-6" />
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
          initialGroupId={groupId}
          initialLessonId={lessonId}
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

      {viewingPlan && (
        <DailyPlanEditor
          mode="edit"
          plan={viewingPlan}
          readOnly
          onClose={() => setViewingId(null)}
          onSaved={() => {
            setViewingId(null);
          }}
        />
      )}
    </div>
  );
}
