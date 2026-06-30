'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DailyPlanEditor, useDailyPlans, useDeleteDailyPlan } from '@/features/daily-plan';
import { DailyPlanListSection } from '@/features/daily-plan/DailyPlanListSection';
import { DailyPlanViewer } from '@/features/daily-plan/DailyPlanViewer';
import { LessonDetailTabSectionHeader } from '@/shared/components/daily-duties/LessonDetailTabSectionHeader';
import { lessonDetailTabShellClass } from '@/shared/components/daily-duties/lesson-detail-tab-layout';

interface DailyPlanTabProps {
  lessonId: string;
  groupId?: string;
  embeddedInSheet?: boolean;
}

export function DailyPlanTab({ lessonId, groupId, embeddedInSheet = false }: DailyPlanTabProps) {
  const t = useTranslations('dailyDuties.lessonActions');
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
    <div className={lessonDetailTabShellClass(embeddedInSheet)}>
      <LessonDetailTabSectionHeader title={t('dailyPlanLabel')} embeddedInSheet={embeddedInSheet} />
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
        onEdit={(plan) => {
          if (plan.canEdit) {
            setEditingId(plan.id);
          }
        }}
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
        <DailyPlanViewer
          plan={viewingPlan}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}
