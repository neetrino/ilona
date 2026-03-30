'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export default function AdminRecordingPage() {
  const t = useTranslations('nav');

  return (
    <DashboardLayout title={t('recording')}>
      <div />
    </DashboardLayout>
  );
}
