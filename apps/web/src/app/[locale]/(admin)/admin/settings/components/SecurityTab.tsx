'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Badge } from '@/shared/components/ui';

interface SecurityTabProps {
  isSaving: boolean;
  onSave: (isSaving: boolean) => void;
}

export function SecurityTab({ isSaving, onSave }: SecurityTabProps) {
  const t = useTranslations('settings');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(t('passwordsDoNotMatch'));
      return;
    }
    onSave(true);
    // TODO: Implement password change API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert(t('passwordChangedSuccess'));
  };

  return (
    <div className="space-y-6">
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
              className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
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
              className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
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
              className="h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] px-4 py-0 focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit"
              size="lg"
              className="h-11 min-h-11 rounded-[15px] bg-[#1010a3] px-6 py-0 text-white hover:bg-[#1010a3]/90"
              disabled={isSaving}
            >
              {isSaving ? t('updating') : t('updatePassword')}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#3b3b40] mb-4">{t('sessions')}</h2>
        <p className="text-sm text-[#8b8b90] mb-4">
          {t('manageActiveSessions')}
        </p>
        <div className="p-4 bg-[#fafafa] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[#3b3b40]">{t('currentSession')}</p>
              <p className="text-xs text-[#8b8b90]">{t('thisDevice')} • {t('activeNow')}</p>
            </div>
          </div>
          <Badge variant="success">{t('active')}</Badge>
        </div>
      </div>
    </div>
  );
}

