'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export default function StudentMyFeedbacksPage() {
  const t = useTranslations('nav');

  return (
    <DashboardLayout title={t('myFeedbacks')}>
      <div />
    </DashboardLayout>
  );
}
