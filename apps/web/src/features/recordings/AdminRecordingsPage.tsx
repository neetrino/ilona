'use client';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { AdminRecordingsPageView } from './AdminRecordingsPageView';
import { useAdminRecordingsPage } from './useAdminRecordingsPage';

export function AdminRecordingsPage() {
  const pageProps = useAdminRecordingsPage();

  return (
    <DashboardLayout
      title={pageProps.tNav('recordings')}
      subtitle={pageProps.tNav('adminRecordingsSubtitle')}
    >
      <AdminRecordingsPageView {...pageProps} />
    </DashboardLayout>
  );
}
