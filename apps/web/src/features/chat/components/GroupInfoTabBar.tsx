'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { GROUP_INFO_TABS, type GroupInfoTab } from './group-members-modal.util';

interface GroupInfoTabBarProps {
  activeTab: GroupInfoTab;
  onChange: (tab: GroupInfoTab) => void;
}

export function GroupInfoTabBar({ activeTab, onChange }: GroupInfoTabBarProps) {
  const tChat = useTranslations('chat');

  return (
    <div
      className="mx-4 mb-2 flex shrink-0 gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1"
      role="tablist"
      aria-label={tChat('groupInfo')}
    >
      {GROUP_INFO_TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#1010a3]/10 text-[#1010a3]'
                : 'text-slate-500 hover:bg-white hover:text-slate-800',
            )}
          >
            {tChat(tab)}
          </button>
        );
      })}
    </div>
  );
}
