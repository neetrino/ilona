'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useSettingsPage } from './hooks/useSettingsPage';
import { SettingsSidebar } from './components/SettingsSidebar';
import { SecurityTab } from './components/SecurityTab';
import { NotificationsTab } from './components/NotificationsTab';
import { SystemTab } from './components/SystemTab';
import { PenaltyTab } from './components/PenaltyTab';
import { ManagerTab } from '@/app/[locale]/(admin)/admin/settings/components/ManagerTab';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const { user } = useAuthStore();
  
  const { activeTab, isSaving, setIsSaving, handleTabChange } = useSettingsPage();

  useEffect(() => {
    if (user?.role === 'MANAGER') {
      router.replace('/admin/dashboard');
    }
  }, [router, user?.role]);

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('subtitle')}
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'security' && (
            <SecurityTab isSaving={isSaving} onSave={setIsSaving} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab />
          )}

          {activeTab === 'system' && (
            <SystemTab />
          )}

          {activeTab === 'penalty' && (
            <PenaltyTab />
          )}

          {activeTab === 'manager' && (
            <ManagerTab />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
