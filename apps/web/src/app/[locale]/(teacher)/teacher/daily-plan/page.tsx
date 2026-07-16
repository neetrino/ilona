'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  useDailyPlans,
  useDeleteDailyPlan,
  useDailyPlanViewSheet,
} from '@/features/daily-plan';
import type { DailyPlan } from '@/features/daily-plan/types';
import { DailyPlanEditor } from '@/features/daily-plan/DailyPlanEditor';
import { DailyPlanListSection } from '@/features/daily-plan/DailyPlanListSection';
import { DailyPlanViewer } from '@/features/daily-plan/DailyPlanViewer';
import { useTeachers } from '@/features/teachers';

export default function TeacherDailyPlanPage() {
  const t = useTranslations('nav');
  const tDaily = useTranslations('dailyPlanPage');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editing, setEditing] = useState<DailyPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({
    status: 'ACTIVE',
    take: 200,
  });

  const teacherOptions = useMemo(() => {
    if (!teachersData?.items) return [];
    return teachersData.items.map((teacher) => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`.trim(),
    }));
  }, [teachersData]);

  const filters = useMemo(() => {
    const next: {
      search?: string;
      teacherId?: string;
      dateFrom?: string;
      dateTo?: string;
      take: number;
    } = { take: 100 };
    const trimmed = search.trim();
    if (trimmed) next.search = trimmed;
    if (teacherId) next.teacherId = teacherId;
    if (dateFrom) next.dateFrom = dateFrom;
    if (dateTo) next.dateTo = dateTo;
    return next;
  }, [search, teacherId, dateFrom, dateTo]);

  const { data, isLoading, refetch } = useDailyPlans(filters);
  const items = data?.items ?? [];
  const remove = useDeleteDailyPlan();
  const { viewing, openView, closeView } = useDailyPlanViewSheet(items);

  return (
    <DashboardLayout
      title={t('dailyPlan')}
      subtitle={tDaily('teacherSubtitle')}
    >
      <DailyPlanListSection
        search={search}
        onSearchChange={setSearch}
        enableStructuredFilters
        teacherId={teacherId}
        onTeacherIdChange={(value) => setTeacherId(value ?? '')}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        teacherOptions={teacherOptions}
        isLoadingTeachers={isLoadingTeachers}
        onCreate={() => router.push(`/${locale}/teacher/daily-plan/new`)}
        createLabel="+ New Daily Plan"
        items={items}
        isLoading={isLoading}
        currentUserId={user?.id}
        alwaysShowMineSection
        emptyDefaultMessage={tDaily('emptyDefault')}
        emptySearchMessage={(query) => tDaily('emptySearch', { query })}
        onView={openView}
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
              error instanceof Error ? error.message : tDaily('deleteError');
            setDeleteError(message);
          } finally {
            setDeletingPlanId(null);
          }
        }}
      />

      {editing && (
        <DailyPlanEditor
          mode="edit"
          plan={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}

      {viewing && <DailyPlanViewer plan={viewing} onClose={closeView} />}
    </DashboardLayout>
  );
}
