'use client';

import { useMemo, useState } from 'react';
import { DailyPlanEditor, useDailyPlans, useDeleteDailyPlan } from '@/features/daily-plan';
import { DailyPlanListSection } from '@/features/daily-plan/DailyPlanListSection';

interface DailyPlanTabProps {
  lessonId: string;
  groupId?: string;
}

export function DailyPlanTab({ lessonId, groupId }: DailyPlanTabProps) {
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      lessonId,
      search: search.trim() || undefined,
      take: 50,
    }),
    [lessonId, search],
  );

  const { data, isLoading, refetch } = useDailyPlans(filters);
  const remove = useDeleteDailyPlan();
  const plans = data?.items ?? [];
  const editingPlan = plans.find((plan) => plan.id === editingId);
  const viewingPlan = plans.find((plan) => plan.id === viewingId);

  return (
    <div className="p-4">
      <DailyPlanListSection
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setIsCreating(true)}
        createLabel="+ New Daily Plan"
        items={plans}
        isLoading={isLoading}
        emptyDefaultMessage="No daily plans for this lesson."
        emptySearchMessage={(query) =>
          `No daily plans for this lesson match "${query}".`
        }
        onView={(plan) => setViewingId(plan.id)}
        onEdit={(plan) => setEditingId(plan.id)}
        deletingPlanId={deletingPlanId}
        deleteError={deleteError}
        onDelete={async (plan) => {
          if (deletingPlanId) {
            return;
          }
          setDeleteError(null);
          setDeletingPlanId(plan.id);
          try {
            await remove.mutateAsync(plan.id);
            await refetch();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to delete daily plan.';
            setDeleteError(message);
          } finally {
            setDeletingPlanId(null);
          }
        }}
      />

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
