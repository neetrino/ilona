'use client';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { CrmExclusiveAudioProvider } from '@/features/crm/components';
import { AdminCrmPageContent } from '@/features/crm/AdminCrmPageContent';
import { useAdminCrmPage } from '@/features/crm/useAdminCrmPage';

export function AdminCrmPage() {
  const { t, tCrm, contentProps } = useAdminCrmPage();

  return (
    <DashboardLayout title={t('crm')} subtitle={tCrm('leadManagement')}>
      <CrmExclusiveAudioProvider>
        <AdminCrmPageContent {...contentProps} />
      </CrmExclusiveAudioProvider>
    </DashboardLayout>
  );
}
