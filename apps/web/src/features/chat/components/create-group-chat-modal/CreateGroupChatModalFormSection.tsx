'use client';

import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS, ADMIN_SEARCH_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import { Input, Label } from '@/shared/components/ui';
import type { CreateGroupChatModalViewModel } from './create-group-chat-modal.types';

export function CreateGroupChatModalFormSection({
  tChat,
  name,
  setName,
  search,
  setSearch,
  teacherIds,
  allTeachersSelected,
  createChatPending,
  toggleAllTeachers,
}: Pick<
  CreateGroupChatModalViewModel,
  | 'tChat'
  | 'name'
  | 'setName'
  | 'search'
  | 'setSearch'
  | 'teacherIds'
  | 'allTeachersSelected'
  | 'createChatPending'
  | 'toggleAllTeachers'
>) {
  return (
    <div className="space-y-4 pb-2">
      <div className="space-y-2">
        <Label htmlFor="group-chat-name">
          {tChat('groupName')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="group-chat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tChat('groupNamePlaceholder')}
          disabled={createChatPending}
          className={ADMIN_FORM_INPUT_CLASS}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="group-chat-member-search">{tChat('members')}</Label>
          {teacherIds.length > 0 && (
            <button
              type="button"
              onClick={toggleAllTeachers}
              className="rounded-[15px] px-2 py-1 text-xs font-medium text-[#1010a3] hover:bg-[#f0f0fc]"
            >
              {allTeachersSelected ? tChat('removeAllTeachers') : tChat('addAllTeachers')}
            </button>
          )}
        </div>
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
          <Input
            id="group-chat-member-search"
            type="search"
            placeholder={tChat('searchByNameEmailPhone')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={ADMIN_SEARCH_INPUT_CLASS}
            disabled={createChatPending}
          />
        </div>
      </div>
    </div>
  );
}
