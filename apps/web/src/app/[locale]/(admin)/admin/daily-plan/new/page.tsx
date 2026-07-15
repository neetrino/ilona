'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { DailyPlanEditorPage } from '@/features/daily-plan/DailyPlanEditorPage';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

export default function AdminNewDailyPlanPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('dailyPlanPage');
  const params = useParams();
  const locale = params.locale as string;
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const listHref = `/${locale}${portalBasePath}/daily-plan`;

  return (
    <DashboardLayout title={t('newTitle')} subtitle={tNav('dailyPlan')}>
      <DailyPlanEditorPage listHref={listHref} />
    </DashboardLayout>
  );
}
