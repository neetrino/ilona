'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useSettingsPage } from './hooks/useSettingsPage';
import { SettingsSidebar } from './components/SettingsSidebar';
import { SecurityTab } from './components/SecurityTab';
import { NotificationsTab } from './components/NotificationsTab';
import { SystemTab } from './components/SystemTab';
import { PercentTab } from './components/PercentTab';

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('settings');
  
  const { activeTab, isSaving, setIsSaving, handleTabChange } = useSettingsPage();

  const handleLogout = () => {
    logout();
    // Redirect to root page after logout
    router.replace('/');
  };

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
          onLogout={handleLogout}
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

          {activeTab === 'percent' && (
            <PercentTab />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
