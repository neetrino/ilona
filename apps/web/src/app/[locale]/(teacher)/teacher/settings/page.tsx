'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { SettingsSidebar } from '@/app/[locale]/(admin)/admin/settings/components/SettingsSidebar';
import { SecurityTab } from '@/app/[locale]/(admin)/admin/settings/components/SecurityTab';
import { PortalNotificationsCard } from '@/features/settings/components/PortalNotificationsCard';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { cn } from '@/shared/lib/utils';

type TeacherSettingsTab = 'security' | 'notifications';

export default function TeacherSettingsPage() {
  useAuthStore();
  const [activeTab, setActiveTab] = useState<TeacherSettingsTab>('security');
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('settings');
  const isIPad = useIsIPad();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lessonReminders, setLessonReminders] = useState(true);
  const [newStudentAlerts, setNewStudentAlerts] = useState(true);
  const [salaryNotifications, setSalaryNotifications] = useState(true);

  const handleTabChange = (tab: TeacherSettingsTab | string) => {
    if (tab === 'security' || tab === 'notifications') {
      setActiveTab(tab);
    }
  };

  return (
    <DashboardLayout title={t('title')} subtitle={t('teacherSubtitle')}>
      <div className={cn('flex min-w-0 flex-col gap-4', isIPad ? '' : 'lg:flex-row lg:gap-6')}>
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          allowedTabs={['security', 'notifications']}
        />

        <div className="min-w-0 flex-1">
          {activeTab === 'security' && (
            <SecurityTab isSaving={isSaving} onSave={setIsSaving} />
          )}

          {activeTab === 'notifications' && (
            <PortalNotificationsCard
              items={[
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
              ]}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
