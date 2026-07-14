'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useDailyPlans, useDeleteDailyPlan } from '@/features/daily-plan';
import type { DailyPlan } from '@/features/daily-plan/types';
import { DailyPlanEditor } from '@/features/daily-plan/DailyPlanEditor';
import { DailyPlanListSection } from '@/features/daily-plan/DailyPlanListSection';
import { DailyPlanViewer } from '@/features/daily-plan/DailyPlanViewer';

export default function AdminDailyPlanPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('dailyPlanPage');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

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
    <DashboardLayout title={tNav('dailyPlan')} subtitle={t('subtitleAll')}>
      <DailyPlanListSection
        search={search}
        onSearchChange={setSearch}
        onCreate={() => setCreating(true)}
        createLabel="+ New Daily Plan"
        showCreate={isAdmin}
        items={items}
        isLoading={isLoading}
        currentUserId={user?.id}
        emptyDefaultMessage={t('emptyDefault')}
        emptySearchMessage={(query) => t('emptySearch', { query })}
        onView={setViewing}
        onEdit={(plan) => {
          if (plan.canEdit) {
            setEditing(plan);
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
              error instanceof Error ? error.message : t('deleteError');
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
        <DailyPlanViewer plan={viewing} onClose={() => setViewing(null)} />
      )}
    </DashboardLayout>
  );
}
