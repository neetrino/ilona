'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

type SettingsTab =
  | 'security'
  | 'notifications'
  | 'system'
  | 'penalty'
  | 'manager'
  | 'dashboard-banner'
  | 'sidebar-visibility';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  allowedTabs?: SettingsTab[];
}

export function SettingsSidebar({ activeTab, onTabChange, allowedTabs }: SettingsSidebarProps) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const isIPad = useIsIPad();
  const isArmenianLocale = locale === 'hy';

  const allTabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
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
      id: 'system',
      label: t('systemSettings'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'penalty',
      label: t('penalty'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'manager',
      label: t('manager'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m10 0H7M9 8h6m-6 4h6" />
        </svg>
      ),
    },
    {
      id: 'dashboard-banner',
      label: t('dashboardBannerTab'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V5z" />
        </svg>
      ),
    },
    {
      id: 'sidebar-visibility',
      label: t('sidebarVisibilityTab'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      ),
    },
  ];

  const tabs = allowedTabs?.length
    ? allTabs.filter((tab) => allowedTabs.includes(tab.id))
    : allTabs;

  return (
    <div
      className={`w-full shrink-0 ${
        isIPad ? '' : isArmenianLocale ? 'lg:w-[22rem]' : 'lg:w-64'
      }`}
    >
      <nav
        className={`flex gap-1 overflow-x-auto overflow-y-hidden rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-2 [&::-webkit-scrollbar]:hidden ${
          isIPad ? '' : 'lg:flex-col lg:overflow-visible'
        }`}
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            className={`flex min-w-0 shrink-0 items-center gap-3 rounded-xl text-left transition-colors ${
              isIPad ? 'max-w-[12rem] py-2.5' : 'py-3 lg:w-full'
            } ${
              isArmenianLocale ? (isIPad ? 'px-3.5' : 'px-5') : isIPad ? 'px-3' : 'px-4'
            } ${
              activeTab === tab.id
                ? 'bg-[#f0f0fc] text-[#1010a3]'
                : 'text-[#3b3b40] hover:bg-[#fafafa]'
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span
              className={`min-w-0 font-medium ${
                isArmenianLocale ? 'pl-0.5' : ''
              } ${isIPad ? 'truncate text-sm' : ''}`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

