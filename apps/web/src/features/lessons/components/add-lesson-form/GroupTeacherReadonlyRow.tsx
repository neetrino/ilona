'use client';

import { getGroupTeacherName } from '@/features/groups';
import type { GroupTeacherRef } from '@/features/groups/types';

export function GroupTeacherReadonlyRow({ teacher }: { teacher: GroupTeacherRef }) {
  const name = getGroupTeacherName(teacher) ?? '';
  const firstName = teacher.user?.firstName || '';
  const lastName = teacher.user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';

  return (
    <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f1f2] text-sm font-medium text-[#3b3b40]">
        {initials}
      </div>
      <span className="min-w-0 truncate text-sm text-[#3b3b40]" title={name}>
        {name}
      </span>
    </div>
  );
}
