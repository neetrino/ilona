'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/shared/lib/utils';
import {
  StudentCard,
  StudentFieldLabel,
  StudentInput,
  StudentPageStack,
  StudentPrimaryButton,
  StudentSectionHeader,
} from '@/features/student-ui';

type SettingsTab = 'security' | 'notifications' | 'system';

export default function TeacherSettingsPage() {
  useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('settings');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [newStudentAlerts, setNewStudentAlerts] = useState(true);
  const [salaryNotifications, setSalaryNotifications] = useState(true);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(t('passwordsDoNotMatch'));
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert(t('passwordChangedSuccess'));
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'security',
      label: t('security'),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: t('notifications'),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'system',
      label: t('systemSettings'),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout title={t('title')} subtitle={t('teacherSubtitle')}>
      <StudentPageStack>
        <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
          <div className="w-full shrink-0 lg:w-64">
            <StudentCard className="p-2 sm:p-2">
              <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex min-w-[8.5rem] items-center gap-3 rounded-[0.875rem] px-4 py-3 text-left transition-colors lg:min-w-0 lg:w-full',
                      tab.id === 'system' && 'hidden lg:flex',
                      activeTab === tab.id
                        ? 'bg-[#1010a3] text-white'
                        : 'text-[#3b3b40] hover:bg-[#f6f6f7]',
                    )}
                  >
                    {tab.icon}
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </StudentCard>
          </div>

          <div className="min-w-0 flex-1">
            {activeTab === 'security' && (
              <StudentCard>
                <StudentSectionHeader title={t('changePassword')} />
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <StudentFieldLabel>{t('currentPassword')}</StudentFieldLabel>
                    <StudentInput
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <StudentFieldLabel>{t('newPassword')}</StudentFieldLabel>
                    <StudentInput
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <StudentFieldLabel>{t('confirmNewPassword')}</StudentFieldLabel>
                    <StudentInput
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-stretch pt-2 sm:justify-end">
                    <StudentPrimaryButton type="submit" disabled={isSaving}>
                      {isSaving ? t('updating') : t('updatePassword')}
                    </StudentPrimaryButton>
                  </div>
                </form>
              </StudentCard>
            )}

            {activeTab === 'notifications' && (
              <StudentCard>
                <StudentSectionHeader title={t('notificationPreferences')} />
                <div className="space-y-1">
                  {[
                    {
                      id: 'email',
                      label: t('emailNotifications'),
                      desc: t('receiveImportantUpdates'),
                      checked: emailNotifications,
                      onChange: setEmailNotifications,
                    },
                    {
                      id: 'lessons',
                      label: t('lessonReminders'),
                      desc: t('getNotifiedBeforeScheduledLessons'),
                      checked: lessonReminders,
                      onChange: setLessonReminders,
                    },
                    {
                      id: 'students',
                      label: t('newStudentAlerts'),
                      desc: t('newStudentAlertsDesc'),
                      checked: newStudentAlerts,
                      onChange: setNewStudentAlerts,
                    },
                    {
                      id: 'salary',
                      label: t('salaryNotifications'),
                      desc: t('salaryNotificationsDesc'),
                      checked: salaryNotifications,
                      onChange: setSalaryNotifications,
                    },
                  ].map((item, index, arr) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
                        index < arr.length - 1 && 'border-b border-[rgba(14,14,16,0.07)]',
                      )}
                    >
                      <div className="min-w-0">
                        <h3 className="font-medium text-[#1010a3]">{item.label}</h3>
                        <p className="text-sm text-[#8b8b90]">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => item.onChange(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="h-6 w-11 rounded-full bg-[#f1f1f2] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-[rgba(14,14,16,0.07)] after:bg-white after:transition-all peer-checked:bg-[#1010a3] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1010a3]/20" />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-stretch pt-4 sm:justify-end">
                  <StudentPrimaryButton type="button">{t('savePreferences')}</StudentPrimaryButton>
                </div>
              </StudentCard>
            )}

            {activeTab === 'system' && (
              <StudentCard className="hidden lg:block">
                <StudentSectionHeader title={t('appearance')} />
                <div>
                  <label className="mb-3 block text-sm font-medium text-[#3b3b40]">
                    {t('language')}
                  </label>
                  <LanguageSwitcher />
                </div>
              </StudentCard>
            )}
          </div>
        </div>
      </StudentPageStack>
    </DashboardLayout>
  );
}
