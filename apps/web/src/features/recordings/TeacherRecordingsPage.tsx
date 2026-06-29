'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useTeacherRecordingsPage } from './useTeacherRecordingsPage';
import { TeacherRecordingsPageContent } from './TeacherRecordingsPageContent';

export function TeacherRecordingsPage() {
  const tNav = useTranslations('nav');
  const pageState = useTeacherRecordingsPage();

  return (
    <DashboardLayout
      title={tNav('recordings')}
      subtitle={tNav('adminRecordingsSubtitle')}
    >
      <TeacherRecordingsPageContent {...pageState} />
    </DashboardLayout>
  );
}
