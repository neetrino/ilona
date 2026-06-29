'use client';

import { useTranslations } from 'next-intl';
import type { TeacherChatTab } from './teacher-chat-list.types';

interface TeacherChatListSearchProps {
  activeTab: TeacherChatTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TeacherChatListSearch({
  activeTab,
  searchQuery,
  onSearchChange,
}: TeacherChatListSearchProps) {
  const tChat = useTranslations('chat');

  const placeholder =
    activeTab === 'admin'
      ? tChat('searchAdmin')
      : activeTab === 'groups'
        ? tChat('searchGroups')
        : tChat('searchStudents');

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8b90]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white py-2 pl-9 pr-4 text-[16px] text-[#3b3b40] placeholder:text-[#8b8b90] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15 lg:text-sm"
      />
    </div>
  );
}
