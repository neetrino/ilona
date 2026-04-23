'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useDailyPlans, useDeleteDailyPlan } from '@/features/daily-plan';
import type { DailyPlan } from '@/features/daily-plan/types';
import { DailyPlanEditor } from '@/features/daily-plan/DailyPlanEditor';
import { DailyPlanListSection } from '@/features/daily-plan/DailyPlanListSection';

export default function TeacherDailyPlanPage() {
  const t = useTranslations('nav');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<DailyPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<DailyPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      <DailyPlanListSection
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setCreating(true)}
        createLabel="+ New Daily Plan"
        items={items}
        isLoading={isLoading}
        emptyDefaultMessage="No daily plans yet. Create one to get started."
        emptySearchMessage={(query) => `No daily plans match "${query}".`}
        onView={setViewing}
        onEdit={setEditing}
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

      {viewing && (
        <DailyPlanEditor
          mode="edit"
          plan={viewing}
          readOnly
          onClose={() => setViewing(null)}
          onSaved={() => {
            setViewing(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
