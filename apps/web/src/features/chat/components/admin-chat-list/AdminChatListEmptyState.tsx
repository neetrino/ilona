'use client';

import { useTranslations } from 'next-intl';
import type { AdminChatTab } from './admin-chat-list.types';

interface AdminChatListEmptyStateProps {
  activeTab: AdminChatTab;
  searchQuery: string;
}

export function AdminChatListEmptyState({ activeTab, searchQuery }: AdminChatListEmptyStateProps) {
  const tChat = useTranslations('chat');

  const title = searchQuery
    ? activeTab === 'teachers'
      ? tChat('noTeachersFound')
      : activeTab === 'groups'
        ? tChat('noGroupsFound')
        : tChat('noStudentsFound')
    : activeTab === 'teachers'
      ? tChat('noTeachersAvailable')
      : activeTab === 'groups'
        ? tChat('noGroupsAvailable')
        : tChat('noStudentsAvailable');

  const subtitle = searchQuery
    ? tChat('tryDifferentSearch')
    : activeTab === 'teachers'
      ? tChat('teachersAppearHere')
      : activeTab === 'groups'
        ? tChat('createGroupOrSelectClass')
        : tChat('studentsAppearHere');

  return (
    <div className="p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {activeTab === 'teachers' ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          ) : activeTab === 'groups' ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 10a3 3 0 11-6 0 3 3 0 016 0zm5 2a3 3 0 11-6 0 3 3 0 016 0zM9 20h5v-2a3 3 0 00-5.196-2.121M9 20H4v-2a3 3 0 015.196-2.121M9 20v-2a3 3 0 015.196-2.121"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          )}
        </svg>
      </div>
      <p className="mb-1 text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
