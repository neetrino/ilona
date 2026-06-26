'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { Clock, MoreVertical } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import type { Group, GroupScheduleEntry } from '../types';
import { getGroupOccupancyMeta } from '../occupancy';
import { GroupIconDisplay } from '../group-icon-registry';
import { getGroupWeeklySlots } from '../group-schedule-utils';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatScheduleSummary(entries: GroupScheduleEntry[] | null | undefined): string[] | null {
  if (!entries || entries.length === 0) return null;
  return entries
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .map((e) => `${DAY_LABELS[e.dayOfWeek] ?? 'Unknown day'}: ${e.startTime} - ${e.endTime}`);
}

interface GroupCardStudentListProps {
  students: NonNullable<Group['students']>;
  onStudentClick?: (studentId: string) => void;
  className?: string;
}

function GroupCardStudentList({ students, onStudentClick, className }: GroupCardStudentListProps) {
  if (students.length === 0) {
    return null;
  }

  return (
    <ul className={className ?? 'space-y-1.5 pl-0 text-sm text-slate-700'}>
      {students.map((s, index) => (
        <li
          key={s.id}
          className="flex items-baseline gap-2 leading-snug"
          title={`${s.user.firstName} ${s.user.lastName}`}
        >
          <span className="shrink-0 tabular-nums font-semibold text-slate-500">{index + 1}.</span>
          {onStudentClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStudentClick(s.id);
              }}
              className="min-w-0 max-w-full w-fit truncate rounded text-left font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:text-primary/90 hover:decoration-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
            >
              {s.user.firstName} {s.user.lastName}
            </button>
          ) : (
            <span className="min-w-0 flex-1 truncate font-medium">
              {s.user.firstName} {s.user.lastName}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

interface GroupCardOverflowMenuProps {
  isActive: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
  isStatusTogglePending?: boolean;
}

function GroupCardOverflowMenu({
  isActive,
  onToggleActive,
  onDelete,
  isStatusTogglePending = false,
}: GroupCardOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsidePress(menuRef, () => setOpen(false), { enabled: open });

  const closeAndRun = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div
      ref={menuRef}
      className="relative shrink-0"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Group actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border-0 text-[#3b3b40] outline-none transition-colors hover:bg-[#f3f3f4] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[10.5rem] overflow-hidden rounded-xl border border-[rgba(14,14,16,0.08)] bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
        >
          <button
            type="button"
            role="menuitem"
            disabled={isStatusTogglePending}
            onClick={() => closeAndRun(onToggleActive)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#3b3b40] transition-colors hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActive ? 'Deactivate group' : 'Activate group'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => closeAndRun(onDelete)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            Delete group
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onStudentClick?: (studentId: string) => void;
  isStatusTogglePending?: boolean;
}

export function GroupCard({
  group,
  onEdit,
  onDelete,
  onToggleActive,
  onStudentClick,
  isStatusTogglePending = false,
}: GroupCardProps) {
  const teacherName = group.teacher ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}` : null;
  const secondTeacherName = group.secondTeacher
    ? `${group.secondTeacher.user.firstName} ${group.secondTeacher.user.lastName}`
    : null;
  const teachersDisplay =
    teacherName && secondTeacherName
      ? `${teacherName} · ${secondTeacherName}`
      : teacherName || secondTeacherName;
  const scheduleSummary = formatScheduleSummary(getGroupWeeklySlots(group.schedule));
  const studentCount = group._count?.students || 0;
  const occupancy = getGroupOccupancyMeta(studentCount);
  const dotColorClass =
    occupancy.status === 'full'
      ? 'bg-green-500'
      : occupancy.status === 'filling'
        ? 'bg-yellow-500'
        : 'bg-red-500';
  const studentListBlockClass =
    'h-[12rem] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]';
  const students = group.students;

  const handleCardActivate = () => {
    onEdit();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onEdit();
    }
  };

  const cardInteractiveClass =
    'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

  return (
    <div className="flex h-full min-w-0 flex-col bg-transparent p-0 shadow-none sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:p-4 sm:shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardActivate}
        onKeyDown={handleCardKeyDown}
        className={cn(
          'flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white sm:hidden',
          cardInteractiveClass,
        )}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
              <span className="shrink-0 self-start" aria-hidden>
                <GroupIconDisplay iconKey={group.iconKey} size={18} />
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-[15px]">
                <p className="min-w-0 break-words text-[1.125rem] font-semibold leading-snug text-[#3b3b40]">
                  {group.name}
                </p>
                {group.level ? (
                  <Badge variant="info" className="shrink-0 px-2 py-0.5 text-xs">
                    {group.level}
                  </Badge>
                ) : null}
              </div>
              <Image
                src="/teachers-logo.webp"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 object-contain"
              />
              <p
                className="min-w-0 truncate text-[1.125rem] font-medium text-[#3b3b40]"
                title={teachersDisplay ?? undefined}
              >
                {teachersDisplay || 'Not assigned'}
              </p>
            </div>
          </div>
          <GroupCardOverflowMenu
            isActive={group.isActive}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
            isStatusTogglePending={isStatusTogglePending}
          />
        </div>

        <div className="mx-4 border-t border-[rgba(14,14,16,0.07)]" />

        {students !== undefined ? (
          <div className={`mx-4 mb-2 flex-1 px-0 text-slate-600 ${studentListBlockClass}`}>
            <GroupCardStudentList
              students={students}
              onStudentClick={onStudentClick}
              className="space-y-2 pl-0 text-[1rem] text-slate-700"
            />
          </div>
        ) : (
          <div className="min-h-[10rem] flex-1" aria-hidden />
        )}

        <div className="border-t border-[rgba(14,14,16,0.07)] px-4 py-3">
          <div className="flex items-center gap-2 text-slate-600">
            <span className={`inline-flex h-3 w-3 rounded-full ${dotColorClass}`} aria-hidden="true" />
            <span className="text-[1.125rem] font-medium text-slate-700">{occupancy.label}</span>
          </div>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleCardActivate}
        onKeyDown={handleCardKeyDown}
        className={cn('hidden h-full min-w-0 flex-col sm:flex', cardInteractiveClass)}
      >
        <div className="mb-3 shrink-0">
          <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
                <span className="shrink-0 self-start" aria-hidden>
                  <GroupIconDisplay iconKey={group.iconKey} size={20} />
                </span>
                <div className="flex min-w-0 flex-wrap items-center gap-[15px]">
                  <h4 className="min-w-0 break-words text-sm font-semibold leading-snug text-slate-800">
                    {group.name}
                  </h4>
                  {group.level ? (
                    <Badge variant="info" className="shrink-0 px-2 py-0.5 text-xs">
                      {group.level}
                    </Badge>
                  ) : null}
                </div>
                {teachersDisplay ? (
                  <>
                    <Image
                      src="/teachers-logo.webp"
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <span className="min-w-0 truncate text-sm font-medium text-slate-600" title={teachersDisplay}>
                      {teachersDisplay}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <GroupCardOverflowMenu
              isActive={group.isActive}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              isStatusTogglePending={isStatusTogglePending}
            />
          </div>
          {scheduleSummary && (
            <div className="mt-2 flex flex-col items-start gap-1.5 text-xs text-slate-600">
              {scheduleSummary && (
                <div className="flex w-full min-w-0 items-start gap-1 text-slate-600">
                  <Clock className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {scheduleSummary.map((slot) => (
                      <span
                        key={slot}
                        className="inline-flex max-w-full items-center break-words rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 leading-snug text-slate-700"
                        title={slot}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {group.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500" title={group.description}>
              {group.description}
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 text-xs">
          {students !== undefined && (
            <div className={`shrink-0 text-slate-600 ${studentListBlockClass}`}>
              <GroupCardStudentList students={students} onStudentClick={onStudentClick} />
            </div>
          )}

          {students !== undefined && <div className="min-h-0 flex-1" aria-hidden />}

          <div className="flex shrink-0 items-center gap-2 text-slate-600">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotColorClass}`} aria-hidden="true" />
            <span className="font-medium text-slate-700">{occupancy.label}</span>
          </div>

          {!group.isActive && (
            <div className="shrink-0 pt-0.5">
              <Badge variant="warning" className="px-2 py-0.5 text-xs">
                Inactive
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

