'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useSettingsPage } from './hooks/useSettingsPage';
import { SettingsSidebar } from './components/SettingsSidebar';
import { SecurityTab } from './components/SecurityTab';
import { NotificationsTab } from './components/NotificationsTab';
import { SystemTab } from './components/SystemTab';
import { PenaltyTab } from './components/PenaltyTab';
import { ManagerTab } from '@/app/[locale]/(admin)/admin/settings/components/ManagerTab';
import { DashboardBannerTab } from './components/DashboardBannerTab';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChangePassword, useUpdateProfile } from '@/features/settings';
import { Button } from '@/shared/components/ui';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { user } = useAuthStore();
  const isManager = user?.role === 'MANAGER';
  
  const { activeTab, isSaving, setIsSaving, handleTabChange } = useSettingsPage();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  const handleUpdateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    try {
      await updateProfile.mutateAsync({ email: normalizedEmail });
      alert('Login updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update login';
      alert(message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert(t('passwordsDoNotMatch'));
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert(t('passwordChangedSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      alert(message);
    }
  };

  if (isManager) {
    return (
      <DashboardLayout
        title={t('title')}
        subtitle={t('subtitle')}
      >
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6">
          <SettingsSidebar
            activeTab="security"
            onTabChange={() => {}}
            allowedTabs={['security']}
          />
          <div className="min-w-0 flex-1 space-y-6">
            <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#3b3b40] mb-6">Login</h2>
              <form onSubmit={handleUpdateLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3b3b40] mb-2">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-[rgba(14,14,16,0.07)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-[#1010a3] hover:bg-[#1010a3]/90 text-white px-6"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? t('saving') : t('saveChanges')}
                  </Button>
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#3b3b40] mb-6">{t('changePassword')}</h2>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#3b3b40] mb-2">
                    {t('currentPassword')}
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[rgba(14,14,16,0.07)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3b3b40] mb-2">
                    {t('newPassword')}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[rgba(14,14,16,0.07)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
                  />
                  <p className="text-xs text-[#8b8b90] mt-1">{t('minimum8Characters')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3b3b40] mb-2">
                    {t('confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[rgba(14,14,16,0.07)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    className="bg-[#1010a3] hover:bg-[#1010a3]/90 text-white px-6"
                    disabled={changePassword.isPending}
                  >
                    {changePassword.isPending ? t('updating') : t('updatePassword')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('subtitle')}
    >
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Sidebar */}
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
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

          {activeTab === 'dashboard-banner' && (
            <DashboardBannerTab />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
