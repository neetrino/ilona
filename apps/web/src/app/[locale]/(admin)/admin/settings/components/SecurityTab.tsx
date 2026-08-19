'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';

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
              placeholder="••••••••"
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
              placeholder="••••••••"
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
              placeholder="••••••••"
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
    </div>
  );
}

