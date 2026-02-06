'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button, Badge } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/shared/lib/utils';

type SettingsTab = 'security' | 'notifications' | 'teaching';

export default function TeacherSettingsPage() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('settings');
  const tRoles = useTranslations('roles');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [newStudentAlerts, setNewStudentAlerts] = useState(true);
  const [salaryNotifications, setSalaryNotifications] = useState(true);

  // Teaching preferences
  const [autoSendVocabulary, setAutoSendVocabulary] = useState(false);
  const [defaultLessonDuration, setDefaultLessonDuration] = useState('45');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(t('passwordsDoNotMatch'));
      return;
    }
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: t('notifications'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'teaching',
      label: t('teaching'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('teacherSubtitle')}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-slate-200 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-medium text-slate-800 mb-2">{t('session')}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {t('signOutDescription')}
            </p>
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={logout}
            >
              {t('signOut')}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('changePassword')}</h2>
              
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('currentPassword')}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('newPassword')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    disabled={isSaving}
                  >
                    {isSaving ? t('updating') : t('updatePassword')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('notificationPreferences')}</h2>
              
              <div className="space-y-6">
                {[
                  { id: 'email', label: t('emailNotifications'), desc: t('receiveImportantUpdates'), checked: emailNotifications, onChange: setEmailNotifications },
                  { id: 'lessons', label: t('lessonReminders'), desc: t('getNotifiedBeforeScheduledLessons'), checked: lessonReminders, onChange: setLessonReminders },
                  { id: 'students', label: t('newStudentAlerts'), desc: t('newStudentAlertsDesc'), checked: newStudentAlerts, onChange: setNewStudentAlerts },
                  { id: 'salary', label: t('salaryNotifications'), desc: t('salaryNotificationsDesc'), checked: salaryNotifications, onChange: setSalaryNotifications },
                ].map((item, index, arr) => (
                  <div key={item.id} className={cn('flex items-center justify-between py-4', index < arr.length - 1 && 'border-b border-slate-100')}>
                    <div>
                      <h3 className="font-medium text-slate-800">{item.label}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                  {t('savePreferences')}
                </Button>
              </div>
            </div>
          )}

          {/* Teaching Tab */}
          {activeTab === 'teaching' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">{t('teachingPreferences')}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('defaultLessonDuration')}
                  </label>
                  <select
                    value={defaultLessonDuration}
                    onChange={(e) => setDefaultLessonDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="30">30 {t('minutes')}</option>
                    <option value="45">45 {t('minutes')}</option>
                    <option value="60">60 {t('minutes')}</option>
                    <option value="90">90 {t('minutes')}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                  <div>
                    <h3 className="font-medium text-slate-800">{t('autoSendVocabulary')}</h3>
                    <p className="text-sm text-slate-500">{t('autoSendVocabularyDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSendVocabulary}
                      onChange={(e) => setAutoSendVocabulary(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                  {t('savePreferences')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
