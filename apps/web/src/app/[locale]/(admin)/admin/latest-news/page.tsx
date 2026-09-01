'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LatestNewsPageContent } from './components/LatestNewsPageContent';

export default function LatestNewsPage() {
  const t = useTranslations('settings');

  return (
    <DashboardLayout title={t('latestNewsTitle')} subtitle={t('latestNewsSubtitle')}>
      <LatestNewsPageContent />
    </DashboardLayout>
  );
}
