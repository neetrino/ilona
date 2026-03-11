'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useSettingsPage } from './hooks/useSettingsPage';
import { SettingsSidebar } from './components/SettingsSidebar';
import { SecurityTab } from './components/SecurityTab';
import { NotificationsTab } from './components/NotificationsTab';
import { SystemTab } from './components/SystemTab';
import { PenaltyTab } from './components/PenaltyTab';

export default function SettingsPage() {
  const t = useTranslations('settings');
  
  const { activeTab, isSaving, setIsSaving, handleTabChange } = useSettingsPage();

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
        </div>
      </div>
    </DashboardLayout>
  );
}
