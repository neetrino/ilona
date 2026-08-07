'use client';

import { cn } from '@/shared/lib/utils';
import type { GroupDetailTab } from './group-detail.constants';

interface GroupDetailTabsProps {
  activeTab: GroupDetailTab;
  onTabChange: (tab: GroupDetailTab) => void;
  labels: Record<GroupDetailTab, string>;
}

const TAB_ORDER: GroupDetailTab[] = ['general', 'students', 'daily-plans'];

export function GroupDetailTabs({ activeTab, onTabChange, labels }: GroupDetailTabsProps) {
  return (
    <div className="border-b border-[rgba(14,14,16,0.08)]">
      <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Group detail sections">
        {TAB_ORDER.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                'shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-[#1010a3] text-[#1010a3]'
                  : 'border-transparent text-[#8b8b90] hover:text-[#3b3b40]',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {labels[tab]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
