'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button, Badge } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Locale } from '@/config/i18n';

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Implement profile update API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Profile updated successfully!');
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || '?';

  return (
    <DashboardLayout 
      title={t('profile')} 
      subtitle={t('profileInformation')}
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('profileInformation')}</h2>
        
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h3 className="font-medium text-slate-800">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm">{t('uploadPhoto')}</Button>
              <Button variant="ghost" size="sm" className="text-red-600">{t('remove')}</Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('firstName')}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('lastName')}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('emailAddress')}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">{t('contactAdminToChangeEmail')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('phoneNumber')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {tCommon('status')}
            </label>
            <div className="flex items-center gap-2">
              <Badge variant="info">{user?.role || 'ADMIN'}</Badge>
              <span className="text-sm text-slate-500">{t('assignedBySystem')}</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              disabled={isSaving}
            >
              {isSaving ? t('saving') : t('saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

