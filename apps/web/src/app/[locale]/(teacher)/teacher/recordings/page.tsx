'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export default function TeacherRecordingsPage() {
  const t = useTranslations('nav');

  return (
    <DashboardLayout title={t('recordings')}>
      <div />
    </DashboardLayout>
  );
}
