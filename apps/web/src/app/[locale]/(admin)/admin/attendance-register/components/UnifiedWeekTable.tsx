'use client';

import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';
import type { TeacherAssignedItem } from '@/features/students';
import { isOnboardingItem } from '@/features/students';
import { useLocale, useTranslations } from 'next-intl';
import type { AttendanceCell } from '../hooks/useAttendanceData';
import { getItemKey } from '../hooks/useAttendanceData';

interface UnifiedWeekTableProps {
  students: TeacherAssignedItem[];
  groups: Group[];
  lessons: Lesson[];
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  weekDates: Date[];
}

type DayStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked' | 'no_session';

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function resolveDayStatus(cells: AttendanceCell[]): DayStatus {
  if (cells.length === 0) return 'no_session';
  if (cells.some((cell) => cell.status === 'absent_unjustified')) return 'absent_unjustified';
  if (cells.some((cell) => cell.status === 'absent_justified')) return 'absent_justified';
  if (cells.every((cell) => cell.status === 'present')) return 'present';
  if (cells.some((cell) => cell.status === 'not_marked')) return 'not_marked';
  return 'not_marked';
}

function getStatusBadge(status: DayStatus): { label: string; className: string } {
  switch (status) {
    case 'present':
      return { label: 'P', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    case 'absent_justified':
      return { label: 'J', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'absent_unjustified':
      return { label: 'U', className: 'bg-red-100 text-red-700 border-red-200' };
    case 'not_marked':
      return { label: '—', className: 'bg-[#f6f6f7] text-[#3b3b40] border-[rgba(14,14,16,0.07)]' };
    default:
      return { label: '•', className: 'bg-[#fafafa] text-[#8b8b90] border-[rgba(14,14,16,0.07)]' };
  }
}

function getStatusTitle(status: DayStatus, t: (key: string) => string): string {
  switch (status) {
    case 'present':
      return t('present');
    case 'absent_justified':
      return t('absentJustifiedLegend');
    case 'absent_unjustified':
      return t('absentUnjustifiedLegend');
    case 'not_marked':
      return t('notMarked');
    default:
      return t('noSession');
  }
}

export function UnifiedWeekTable({
  students,
  groups,
  lessons,
  attendanceData,
  weekDates,
}: UnifiedWeekTableProps) {
  const t = useTranslations('attendance');
  const locale = useLocale();
  const lessonsByDate = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const key = lesson.scheduledAt.split('T')[0];
    const list = lessonsByDate.get(key) ?? [];
    list.push(lesson);
    lessonsByDate.set(key, list);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[rgba(14,14,16,0.07)] bg-white">
      <table className="w-full min-w-[920px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-3 py-2 text-left text-xs font-semibold uppercase text-[#8b8b90]">
              {t('studentColumn')}
            </th>
            <th className="border-b border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-3 py-2 text-left text-xs font-semibold uppercase text-[#8b8b90]">
              {t('registerGroupLabel')}
            </th>
            {weekDates.map((date) => (
              <th
                key={date.toISOString()}
                className="border-b border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-3 py-2 text-center text-xs font-semibold uppercase text-[#8b8b90]"
              >
                {date.toLocaleDateString(locale, { weekday: 'short' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const studentId = getItemKey(student);
            const groupId = isOnboardingItem(student) ? student.groupId : student.groupId;
            const groupName = groupId ? groups.find((group) => group.id === groupId)?.name ?? '—' : '—';
            const fullName = isOnboardingItem(student)
              ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || t('unknownStudent')
              : `${student.user.firstName} ${student.user.lastName}`;

            return (
              <tr key={studentId} className="border-b border-[rgba(14,14,16,0.07)]">
                <td className="px-3 py-2 text-sm font-medium text-[#3b3b40]">{fullName}</td>
                <td className="px-3 py-2 text-sm text-[#3b3b40]">{groupName}</td>
                {weekDates.map((date) => {
                  const dateKey = getDateKey(date);
                  const dayLessons = lessonsByDate.get(dateKey) ?? [];
                  const cells = dayLessons
                    .map((lesson) => attendanceData[lesson.id]?.[studentId])
                    .filter((cell): cell is AttendanceCell => Boolean(cell));
                  const status = resolveDayStatus(cells);
                  const badge = getStatusBadge(status);
                  return (
                    <td key={`${studentId}-${dateKey}`} className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-semibold ${badge.className}`}
                        title={getStatusTitle(status, t)}
                      >
                        {badge.label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
