'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { DailyPlanEditorPage } from '@/features/daily-plan/DailyPlanEditorPage';

export default function TeacherNewDailyPlanPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('dailyPlanPage');
  const params = useParams();
  const locale = params.locale as string;
  const listHref = `/${locale}/teacher/daily-plan`;

  return (
    <DashboardLayout title={t('newTitle')} subtitle={tNav('dailyPlan')}>
      <DailyPlanEditorPage listHref={listHref} />
    </DashboardLayout>
  );
}