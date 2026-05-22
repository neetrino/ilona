'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
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

type SettingsTab = 'security' | 'notifications';

export default function StudentSettingsPage() {
  useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('settings');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [vocabularyReminders, setVocabularyReminders] = useState(true);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    alert('Password changed successfully!');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout title={t('title')} subtitle={t('subtitle')}>
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
                <StudentSectionHeader title="Change Password" />
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <StudentFieldLabel>Current Password</StudentFieldLabel>
                    <StudentInput
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <StudentFieldLabel>New Password</StudentFieldLabel>
                    <StudentInput
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-[#8b8b90]">Minimum 8 characters</p>
                  </div>
                  <div>
                    <StudentFieldLabel>Confirm New Password</StudentFieldLabel>
                    <StudentInput
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-stretch pt-2 sm:justify-end">
                    <StudentPrimaryButton type="submit" disabled={isSaving}>
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </StudentPrimaryButton>
                  </div>
                </form>
              </StudentCard>
            )}

            {activeTab === 'notifications' && (
              <StudentCard>
                <StudentSectionHeader title="Notification Preferences" />
                <div className="space-y-1">
                  {[
                    {
                      id: 'email',
                      label: 'Email Notifications',
                      desc: 'Receive important updates via email',
                      checked: emailNotifications,
                      onChange: setEmailNotifications,
                    },
                    {
                      id: 'lessons',
                      label: 'Lesson Reminders',
                      desc: 'Get notified before scheduled lessons',
                      checked: lessonReminders,
                      onChange: setLessonReminders,
                    },
                    {
                      id: 'payments',
                      label: 'Payment Reminders',
                      desc: 'Alerts about upcoming and overdue payments',
                      checked: paymentReminders,
                      onChange: setPaymentReminders,
                    },
                    {
                      id: 'vocabulary',
                      label: 'Vocabulary Practice',
                      desc: 'Reminders to practice new vocabulary',
                      checked: vocabularyReminders,
                      onChange: setVocabularyReminders,
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
                  <StudentPrimaryButton type="button">Save Preferences</StudentPrimaryButton>
                </div>
              </StudentCard>
            )}
          </div>
        </div>
      </StudentPageStack>
    </DashboardLayout>
  );
}
