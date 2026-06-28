'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { LessonListScheduleCategoryCell } from '@/shared/components/calendar/LessonListScheduleCategoryCell';
import { CheckCircle2, Pencil } from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import type { TeacherCalendarRowCategory } from '@/shared/lib/calendar/teacher-calendar-list-order';
import type { ScheduleCardDayStatus } from '@/features/schedule/schedule-dates';
import { getLessonActionsDerived, type LessonActionId } from '@/shared/lib/calendar/lesson-action-states';
import { CalendarListActionPill } from '@/shared/components/calendar/CalendarListActionPill';
import { LessonListDateCell } from '@/shared/components/calendar/LessonListDateCell';
import { isAdminPortalPath } from '@/shared/lib/role-routes';

export type LessonListTableBodyRowProps = {
  lesson: Lesson;
  locale: string;
  hideTeacherColumn: boolean;
  isTeacher: boolean;
  isSelected: boolean;
  onSelectLesson: (lessonId: string, checked: boolean) => void;
  dateStatus: ScheduleCardDayStatus;
  onObligationClick?: (
    lessonId: string,
    obligation: 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan',
  ) => void;
  onComplete?: (lessonId: string) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onAssignSubstitute?: (lessonId: string) => void;
  hideActionsColumn?: boolean;
  onRowClick?: (lessonId: string) => void;
  scheduleCategory?: TeacherCalendarRowCategory;
  scheduleCategoryLabels: {
    upcoming: string;
    upcomingNext: string;
    today: string;
    completed: string;
    todayPastSlot: string;
  };
};

export function LessonListTableBodyRow({
  lesson,
  locale,
  hideTeacherColumn,
  isTeacher,
  isSelected,
  onSelectLesson,
  dateStatus,
  onObligationClick,
  onComplete,
  onEdit,
  onDelete,
  onAssignSubstitute,
  hideActionsColumn = false,
  onRowClick,
  scheduleCategory,
  scheduleCategoryLabels,
}: LessonListTableBodyRowProps) {
  const router = useRouter();
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');

  const actions = useMemo(() => getLessonActionsDerived(lesson), [lesson]);
  const actionMap = useMemo(() => {
    const m = new Map<LessonActionId, (typeof actions)[0]>();
    for (const a of actions) m.set(a.id, a);
    return m;
  }, [actions]);

  const teacherName = lesson.teacher?.user
    ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`
    : t('unknownTeacher');

  const getRowColor = () => {
    if (lesson.completionStatus === 'DONE') {
      return 'bg-green-50 hover:bg-green-100';
    }
    if (lesson.completionStatus === 'IN_PROCESS') {
      return 'bg-yellow-50 hover:bg-yellow-100';
    }
    if (dateStatus === 'today') {
      return 'bg-blue-50 hover:bg-blue-100';
    }
    if (dateStatus === 'past') {
      return 'bg-slate-50 hover:bg-slate-100';
    }
    return 'hover:bg-slate-50';
  };

  const rowClassName = cn(
    'transition-colors',
    getRowColor(),
    onRowClick && 'cursor-pointer',
  );
  const isLocked = isTeacher && lesson.isLockedForTeacher;

  const handleView = (lessonId: string) => {
    const currentPath = window.location.pathname;
    if (isAdminPortalPath(currentPath.replace(/^\/[a-z]{2}\//, '/'))) {
      const portalRoot = currentPath.includes('/manager/') ? '/manager' : '/admin';
      router.push(`${portalRoot}/calendar/${lessonId}`);
    } else if (currentPath.includes('/teacher/')) {
      router.push(`/teacher/calendar/${lessonId}`);
    } else {
      router.push(`/calendar/${lessonId}`);
    }
  };

  const startMs = new Date(lesson.scheduledAt).getTime();
  const isPastInstant = !Number.isNaN(startMs) && startMs < Date.now();

  const obligationIds: LessonActionId[] = ['absence', 'feedback', 'voice', 'text', 'dailyPlan'];

  return (
    <tr
      className={rowClassName}
      onClick={onRowClick ? () => onRowClick(lesson.id) : undefined}
    >
      <td
        className={cn(
          'border-l-4 px-4 py-3',
          lesson.completionStatus === 'IN_PROCESS' ? 'border-amber-300' : 'border-transparent',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectLesson(lesson.id, checked === true)}
        />
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-semibold text-slate-800">{lesson.group?.name || t('unknownGroupName')}</p>
        </div>
      </td>
      <td className="px-4 py-3 align-middle text-center">
        <div className="flex min-h-[1.75rem] items-center justify-center">
          {lesson.completionStatus === 'DONE' && (
            <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">
              {t('completed')}
            </Badge>
          )}
          {lesson.completionStatus === 'IN_PROCESS' && (
            <Badge variant="warning" className="bg-yellow-100 text-yellow-700 border-yellow-200">
              {t('statusInProcess')}
            </Badge>
          )}
        </div>
      </td>
      {scheduleCategory !== undefined && (
        <LessonListScheduleCategoryCell
          scheduleCategory={scheduleCategory}
          scheduleCategoryLabels={scheduleCategoryLabels}
          isPastInstant={isPastInstant}
        />
      )}
      <td className="px-4 py-3 text-center align-middle">
        <div className="flex justify-center">
          <LessonListDateCell dateStr={lesson.scheduledAt} locale={locale} />
        </div>
      </td>
      {!hideTeacherColumn && (
        <td className="px-4 py-3 text-center align-middle">
          <p className="text-sm text-slate-700">{teacherName}</p>
          {lesson.substituteTeacher?.user && (
            <p className="mt-1 text-xs text-amber-800">
              {t('substituteShort')} {lesson.substituteTeacher.user.firstName}{' '}
              {lesson.substituteTeacher.user.lastName}
            </p>
          )}
        </td>
      )}
      {obligationIds.map((id) => (
        <td
          key={id}
          className="px-1 py-2 text-center align-middle sm:px-2 sm:py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center">
            <CalendarListActionPill
              action={actionMap.get(id)!}
              onActivate={() => onObligationClick?.(lesson.id, id)}
            />
          </div>
        </td>
      ))}
      {!hideActionsColumn && (
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {!isTeacher && onAssignSubstitute && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAssignSubstitute(lesson.id)}
                className="text-amber-700 hover:text-amber-800"
                title={t('assignSubstituteTitle')}
              >
                <Image
                  src="/icons/substitute-teacher.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0"
                  aria-hidden
                />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(lesson.id)}
              className="text-blue-600 hover:text-blue-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </Button>
            {onComplete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComplete(lesson.id)}
                disabled={lesson.status === 'COMPLETED' || isLocked}
                className={cn(
                  lesson.status === 'COMPLETED' ? 'text-green-600 cursor-default' : 'text-green-600 hover:text-green-700',
                  isLocked && 'opacity-50 cursor-not-allowed',
                )}
                title={
                  lesson.status === 'COMPLETED'
                    ? t('lessonAlreadyCompleted')
                    : isLocked
                      ? t('lessonLocked')
                      : t('markLessonCompleted')
                }
              >
                {lesson.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(lesson.id)}
                disabled={isLocked}
                className={cn('text-slate-600 hover:text-slate-700', isLocked && 'opacity-50 cursor-not-allowed')}
                title={isLocked ? t('lessonLockedEdit') : tCommon('edit')}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(lesson.id)}
                disabled={isLocked}
                className={cn('text-red-600 hover:text-red-700', isLocked && 'opacity-75 cursor-not-allowed')}
                title={isLocked ? t('lessonLockedDelete') : tCommon('delete')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
