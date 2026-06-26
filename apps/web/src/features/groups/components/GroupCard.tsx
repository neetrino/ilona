'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import { Badge, ActionButtons } from '@/shared/components/ui';
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
              className="min-w-0 flex-1 truncate rounded text-left font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:text-primary/90 hover:decoration-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
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
  const t = useTranslations('groups');
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

  return (
    <div className="flex h-full min-w-0 flex-col bg-transparent p-0 shadow-none transition-shadow hover:shadow-none sm:rounded-lg sm:border sm:border-slate-200 sm:bg-white sm:p-4 sm:shadow-sm sm:hover:shadow-md">
      <div className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white sm:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0" aria-hidden>
              <GroupIconDisplay iconKey={group.iconKey} size={18} />
            </span>
            <p className="truncate text-[1.125rem] font-semibold text-[#3b3b40]">{group.name}</p>
          </div>
          <button
            type="button"
            onClick={onToggleActive}
            disabled={isStatusTogglePending}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              group.isActive ? 'bg-[#22c55e]' : 'bg-slate-300'
            } ${isStatusTogglePending ? 'opacity-60' : ''}`}
            aria-label={group.isActive ? 'Deactivate group' : 'Activate group'}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                group.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mx-4 border-t border-[rgba(14,14,16,0.07)]" />

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Image src="/teachers-logo.webp" alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />
            <p className="truncate text-[1.125rem] font-medium text-[#3b3b40]">{teachersDisplay || 'Not assigned'}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#3b3b40] hover:bg-[#f3f3f4]"
              aria-label={t('editGroup')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#3b3b40] hover:bg-[#f3f3f4]"
              aria-label={t('deleteGroup')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mx-4 border-t border-[rgba(14,14,16,0.07)]" />

        <div className="px-4 py-3">
          {group.level ? (
            <Badge variant="info" className="px-2 py-0.5 text-base">
              {group.level}
            </Badge>
          ) : null}
        </div>

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

      <div className="hidden h-full min-w-0 flex-col sm:flex">
        <div className="mb-3 shrink-0">
          <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <span className="mt-0.5 shrink-0" aria-hidden>
                <GroupIconDisplay iconKey={group.iconKey} size={20} />
              </span>
              <h4 className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-slate-800">
                {group.name}
              </h4>
            </div>
            {teachersDisplay && (
              <div className="ml-2 flex shrink-0 items-center gap-1.5 border-l border-slate-200 pl-2" title={teachersDisplay}>
                <Image
                  src="/teachers-logo.webp"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0 object-contain"
                />
                <span className="max-w-[11rem] truncate text-sm font-medium text-slate-600">{teachersDisplay}</span>
              </div>
            )}
            <ActionButtons
              onEdit={onEdit}
              onDisable={onToggleActive}
              onDelete={onDelete}
              isActive={group.isActive}
              size="sm"
              disableDisabled={isStatusTogglePending}
              ariaLabels={{
                edit: 'Edit group',
                disable: group.isActive ? 'Deactivate group' : 'Activate group',
                delete: 'Delete group',
              }}
              titles={{
                edit: 'Edit group',
                disable: group.isActive ? 'Deactivate group' : 'Activate group',
                delete: 'Delete group',
              }}
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
          {group.level && (
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="info" className="px-2 py-0.5 text-xs">
                {group.level}
              </Badge>
            </div>
          )}

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

