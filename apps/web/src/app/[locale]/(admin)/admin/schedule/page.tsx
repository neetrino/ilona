'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export default function AdminSchedulePage() {
  const t = useTranslations('nav');

  return (
    <DashboardLayout title={t('schedule')}>
      <div />
    </DashboardLayout>
  );
}
