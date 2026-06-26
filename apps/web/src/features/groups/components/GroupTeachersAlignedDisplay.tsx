import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import type { Group } from '../types';
import { getGroupTeacherName } from '../lib/group-teachers-display';

type GroupTeacherRef = NonNullable<Group['teacher']>;

interface GroupTeachersAlignedDisplayProps {
  teachers: GroupTeacherRef[];
  emptyLabel: string;
  variant: 'list' | 'card';
  nameClassName?: string;
}

function GroupTeacherAvatar({
  teacher,
  variant,
}: {
  teacher: GroupTeacherRef;
  variant: 'list' | 'card';
}) {
  const firstName = teacher.user?.firstName || '';
  const lastName = teacher.user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';

  if (variant === 'card') {
    return (
      <Image
        src="/teachers-logo.webp"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 object-contain"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f1f2] text-sm font-medium text-[#3b3b40]">
      {initials}
    </div>
  );
}

export function GroupTeachersAlignedDisplay({
  teachers,
  emptyLabel,
  variant,
  nameClassName,
}: GroupTeachersAlignedDisplayProps) {
  const defaultNameClassName =
    variant === 'list'
      ? 'text-[#3b3b40]'
      : 'text-sm font-medium text-slate-600';

  if (teachers.length === 0) {
    if (variant === 'card') {
      return (
        <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-2">
          <Image
            src="/teachers-logo.webp"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 shrink-0 object-contain"
          />
          <span className={cn('min-w-0 truncate', nameClassName ?? defaultNameClassName)}>{emptyLabel}</span>
        </div>
      );
    }

    return <span className="text-amber-600 text-sm">{emptyLabel}</span>;
  }

  return (
    <div
      className={cn(
        'grid min-w-0 items-center gap-x-3',
        teachers.length > 1 ? 'grid-cols-2' : 'max-w-max grid-cols-1',
      )}
    >
      {teachers.map((teacher) => {
        const name = getGroupTeacherName(teacher) ?? emptyLabel;
        return (
          <div key={teacher.id} className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-2">
            <GroupTeacherAvatar teacher={teacher} variant={variant} />
            <span
              className={cn('min-w-0 truncate', nameClassName ?? defaultNameClassName)}
              title={name}
            >
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
