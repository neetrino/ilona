'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { Clock, MoreVertical } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';
import type { Group, GroupScheduleEntry } from '../types';
import { getGroupOccupancyMeta } from '../occupancy';
import { GroupIconDisplay } from '../group-icon-registry';
import { getGroupWeeklySlots } from '../group-schedule-utils';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatScheduleSummary(entries: GroupScheduleEntry[] | null | undefined): string[] | null {
  if (!entries || entries.length === 0) return null;
  return entries
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .map((e) => `${DAY_LABELS[e.dayOfWeek] ?? 'Unknown day'}: ${e.startTime} - ${e.endTime}`);
}

const MAX_CARD_STUDENTS = 8;
const CARD_STUDENTS_LEFT_COLUMN_SIZE = 4;

function getOccupancyDotClass(status: ReturnType<typeof getGroupOccupancyMeta>['status']): string {
  if (status === 'full') return 'bg-green-500';
  if (status === 'filling') return 'bg-orange-500';
  return 'bg-red-500';
}

interface GroupCardScheduleSlotsProps {
  slots: string[];
  layout?: 'inline' | 'paired';
}

function GroupCardScheduleSlots({ slots, layout = 'inline' }: GroupCardScheduleSlotsProps) {
  const pillClass =
    layout === 'paired'
      ? 'flex w-full min-w-0 items-start justify-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs leading-snug text-slate-700 whitespace-normal'
      : 'inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs leading-snug text-slate-700';

  return (
    <div
      className={cn(
        'min-w-0 flex-1',
        layout === 'paired'
          ? 'grid grid-cols-2 items-start gap-x-2 gap-y-1.5'
          : 'flex flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
      )}
    >
      {slots.map((slot) => (
        <span key={slot} className={pillClass} title={slot}>
          {slot}
        </span>
      ))}
    </div>
  );
}

interface GroupCardStudentListProps {
  students: NonNullable<Group['students']>;
  onStudentClick?: (studentId: string) => void;
  className?: string;
  itemClassName?: string;
  layout?: 'single' | 'double';
  numberClassName?: string;
  nameClassName?: string;
}

function GroupCardStudentItem({
  student,
  index,
  onStudentClick,
  itemClassName,
  numberClassName,
  nameClassName,
}: {
  student: NonNullable<Group['students']>[number];
  index: number;
  onStudentClick?: (studentId: string) => void;
  itemClassName?: string;
  numberClassName?: string;
  nameClassName?: string;
}) {
  const fullName = `${student.user.firstName} ${student.user.lastName}`;

  return (
    <li
      className={cn('flex min-w-0 items-baseline gap-1.5 leading-snug', itemClassName)}
      title={fullName}
    >
      <span className={cn('shrink-0 tabular-nums text-slate-500', numberClassName)}>{index + 1}.</span>
      {onStudentClick ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStudentClick(student.id);
          }}
          className={cn(
            'min-w-0 max-w-full w-fit truncate rounded text-left font-semibold text-[#1010a3] underline decoration-[#1010a3]/40 underline-offset-2 hover:text-[#1010a3]/90 hover:decoration-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-1',
            nameClassName,
          )}
        >
          {fullName}
        </button>
      ) : (
        <span className={cn('min-w-0 truncate font-semibold text-[#1010a3]', nameClassName)}>{fullName}</span>
      )}
    </li>
  );
}

function GroupCardStudentList({
  students,
  onStudentClick,
  className,
  itemClassName,
  layout = 'double',
  numberClassName,
  nameClassName,
}: GroupCardStudentListProps) {
  if (students.length === 0) {
    return null;
  }

  const visibleStudents = students.slice(0, MAX_CARD_STUDENTS);

  if (layout === 'single') {
    return (
      <ul className={cn('min-w-0 list-none space-y-2 p-0', className)}>
        {visibleStudents.map((student, index) => (
          <GroupCardStudentItem
            key={student.id}
            student={student}
            index={index}
            onStudentClick={onStudentClick}
            itemClassName={itemClassName}
            numberClassName={numberClassName}
            nameClassName={nameClassName}
          />
        ))}
      </ul>
    );
  }

  const leftStudents = visibleStudents.slice(0, CARD_STUDENTS_LEFT_COLUMN_SIZE);
  const rightStudents = visibleStudents.slice(CARD_STUDENTS_LEFT_COLUMN_SIZE);

  const renderColumn = (columnStudents: typeof visibleStudents, startIndex: number) => (
    <ul className="min-w-0 list-none space-y-1.5 p-0">
      {columnStudents.map((student, columnIndex) => (
        <GroupCardStudentItem
          key={student.id}
          student={student}
          index={startIndex + columnIndex}
          onStudentClick={onStudentClick}
          itemClassName={itemClassName}
          numberClassName={numberClassName}
          nameClassName={nameClassName}
        />
      ))}
    </ul>
  );

  return (
    <div className={cn('grid min-w-0 grid-cols-2 gap-x-3', className)}>
      {renderColumn(leftStudents, 0)}
      {renderColumn(rightStudents, CARD_STUDENTS_LEFT_COLUMN_SIZE)}
    </div>
  );
}

interface GroupCardOverflowMenuProps {
  isActive: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
  isStatusTogglePending?: boolean;
  deactivateLabel?: string;
  activateLabel?: string;
  deleteLabel?: string;
  menuAriaLabel?: string;
}

export function GroupCardOverflowMenu({
  isActive,
  onToggleActive,
  onDelete,
  isStatusTogglePending = false,
  deactivateLabel = 'Deactivate group',
  activateLabel = 'Activate group',
  deleteLabel = 'Delete group',
  menuAriaLabel = 'Group actions',
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
        aria-label={menuAriaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${ADMIN_ICON_BUTTON_SM_CLASS} border-0 text-[#3b3b40] outline-none hover:bg-[#f3f3f4] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0`}
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
            {isActive ? deactivateLabel : activateLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => closeAndRun(onDelete)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            {deleteLabel}
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
  const dotColorClass = getOccupancyDotClass(occupancy.status);
  const studentListBlockClass = 'min-w-0 overflow-x-hidden text-sm text-slate-700';
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
          'flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm sm:hidden',
          cardInteractiveClass,
        )}
      >
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <span className="shrink-0 self-start pt-0.5" aria-hidden>
                <GroupIconDisplay iconKey={group.iconKey} size={18} />
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 break-words text-lg font-semibold leading-snug text-[#1a1a1a]">
                  {group.name}
                </p>
                {group.level ? (
                  <Badge variant="info" className="shrink-0 px-2 py-0.5 text-xs">
                    {group.level}
                  </Badge>
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

          <div className="mt-1.4 flex min-w-0 items-center gap-2">
            <Image
              src="/teachers-logo.webp"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 shrink-0 object-contain"
            />
            <p
              className="min-w-0 truncate text-sm font-normal text-[#8b8b90]"
              title={teachersDisplay ?? undefined}
            >
              {teachersDisplay || 'Not assigned'}
            </p>
          </div>

          {scheduleSummary ? (
            <div className="mt-3.5 flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                <Clock className="h-5 w-5 text-[#8b8b90]" />
              </span>
              <GroupCardScheduleSlots slots={scheduleSummary} layout="paired" />
            </div>
          ) : null}
        </div>

        <div className="mx-4 border-t border-[rgba(14,14,16,0.07)]" />

        {students !== undefined ? (
          <div className={cn('px-4 py-3', studentListBlockClass)}>
            <GroupCardStudentList
              students={students}
              onStudentClick={onStudentClick}
              layout="double"
              numberClassName="font-normal text-[#8b8b90]"
            />
          </div>
        ) : (
          <div className="min-h-[4rem] flex-1" aria-hidden />
        )}

        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotColorClass}`} aria-hidden="true" />
            <span className="text-sm font-normal text-[#3b3b40]">{occupancy.label}</span>
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
            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-[5px]">
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
              {scheduleSummary ? (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </span>
                  <GroupCardScheduleSlots slots={scheduleSummary} layout="inline" />
                </div>
              ) : null}
            </div>
            <GroupCardOverflowMenu
              isActive={group.isActive}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
              isStatusTogglePending={isStatusTogglePending}
            />
          </div>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500" title={group.description}>
              {group.description}
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-col gap-2 text-xs">
          {students !== undefined && (
            <div className={studentListBlockClass}>
              <GroupCardStudentList students={students} onStudentClick={onStudentClick} />
            </div>
          )}

          <div className="mt-3 flex shrink-0 items-center gap-2 text-slate-600">
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

