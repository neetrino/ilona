'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/components/ui/badge';
import type { AdminChatListViewModel } from './admin-chat-list.types';

interface AdminChatListTabBarProps {
  activeTab: AdminChatListViewModel['activeTab'];
  unreadCounts: AdminChatListViewModel['unreadCounts'];
  onTabChange: AdminChatListViewModel['onTabChange'];
}

export function AdminChatListTabBar({
  activeTab,
  unreadCounts,
  onTabChange,
}: AdminChatListTabBarProps) {
  const tChat = useTranslations('chat');

  const tabButtonClass = (tab: NonNullable<AdminChatListViewModel['activeTab']>) =>
    cn(
      'flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-colors',
      'sm:relative sm:gap-0 sm:px-1.5 sm:py-2.5 sm:text-center sm:text-xs lg:text-sm',
      activeTab === tab
        ? 'bg-[#e8eaf6] text-[#1010a3]'
        : 'bg-[#f6f6f7] text-[#8b8b90] hover:bg-[#ececec]',
    );

  const tabUnreadBadgeClass =
    'flex h-4 min-w-[18px] shrink-0 items-center justify-center px-1 text-xs sm:absolute sm:-right-0.5 sm:-top-0.5 sm:min-w-[16px] sm:px-0.5 sm:text-[10px] sm:leading-none';

  return (
    <div className="mx-auto grid w-full max-w-full grid-cols-3 gap-2 sm:grid-cols-[0.82fr_1.09fr_1.09fr] sm:gap-1.5">
      <button type="button" onClick={() => onTabChange('groups')} className={tabButtonClass('groups')}>
        <span className="sm:px-0.5">{tChat('groups')}</span>
        {unreadCounts.groups > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.groups}
          </Badge>
        )}
      </button>
      <button type="button" onClick={() => onTabChange('teachers')} className={tabButtonClass('teachers')}>
        <span className="sm:px-0.5">{tChat('teachersTab')}</span>
        {unreadCounts.teachers > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.teachers}
          </Badge>
        )}
      </button>
      <button type="button" onClick={() => onTabChange('students')} className={tabButtonClass('students')}>
        <span className="sm:px-0.5">{tChat('students')}</span>
        {unreadCounts.students > 0 && (
          <Badge variant="error" className={tabUnreadBadgeClass}>
            {unreadCounts.students}
          </Badge>
        )}
      </button>
    </div>
  );
}
