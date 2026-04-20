'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import {
  getMonthDates,
  formatDateString,
  formatMonthDisplay,
  isToday,
  isCurrentMonth,
  getPreviousMonth,
  getNextMonth,
} from '@/features/attendance/utils/dateUtils';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarLesson, StudentCalendarMonth } from '@/features/attendance';
import {
  useCreateMyPlannedAbsence,
  useDeleteMyPlannedAbsence,
} from '@/features/attendance';

interface StudentAbsenceCalendarProps {
  calendarData: StudentCalendarMonth | undefined;
  isLoading: boolean;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

type DayKind =
  | 'noClass'
  | 'futurePlanned'
  | 'futureOpen'
  | 'pastPresent'
  | 'pastAbsent'
  | 'pastMixed'
  | 'pastUnmarked';

function lessonDateKey(scheduledAt: string): string {
  return formatDateString(new Date(scheduledAt));
}

function analyzeDay(
  dateStr: string,
  lessonsOnDay: CalendarLesson[],
  attendanceByLessonId: Map<
    string,
    NonNullable<StudentCalendarMonth['attendances']>[number]
  >,
  plannedForDay: { id: string; comment: string } | undefined,
  now: Date
): {
  kind: DayKind;
  hasClass: boolean;
  canReportAbsence: boolean;
} {
  const hasClass = lessonsOnDay.length > 0;
  if (!hasClass) {
    return { kind: 'noClass', hasClass: false, canReportAbsence: false };
  }

  const hasUpcomingLesson = lessonsOnDay.some((l) => new Date(l.scheduledAt) > now);
  const allLessonsEnded = lessonsOnDay.every((l) => new Date(l.scheduledAt) <= now);

  if (hasUpcomingLesson) {
    if (plannedForDay) {
      return { kind: 'futurePlanned', hasClass: true, canReportAbsence: true };
    }
    return { kind: 'futureOpen', hasClass: true, canReportAbsence: true };
  }

  // Past (no upcoming slot this day)
  if (!allLessonsEnded) {
    // Should not happen if hasUpcoming is false
    return { kind: 'pastUnmarked', hasClass: true, canReportAbsence: false };
  }

  let present = 0;
  let absent = 0;
  let unmarked = 0;
  for (const l of lessonsOnDay) {
    const a = attendanceByLessonId.get(l.id);
    if (!a) {
      unmarked += 1;
    } else if (a.isPresent) {
      present += 1;
    } else {
      absent += 1;
    }
  }

  if (unmarked > 0) {
    return { kind: 'pastUnmarked', hasClass: true, canReportAbsence: false };
  }
  if (absent === 0) {
    return { kind: 'pastPresent', hasClass: true, canReportAbsence: false };
  }
  if (present === 0) {
    return { kind: 'pastAbsent', hasClass: true, canReportAbsence: false };
  }
  return { kind: 'pastMixed', hasClass: true, canReportAbsence: false };
}

export function StudentAbsenceCalendar({
  calendarData,
  isLoading,
  currentMonth,
  onMonthChange,
}: StudentAbsenceCalendarProps) {
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
  const monthDates = getMonthDates(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const createPlanned = useCreateMyPlannedAbsence();
  const deletePlanned = useDeleteMyPlannedAbsence();

  const lessonsByDate = useMemo(() => {
    const m = new Map<string, CalendarLesson[]>();
    for (const l of calendarData?.lessons ?? []) {
      const key = lessonDateKey(l.scheduledAt);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(l);
    }
    for (const [, arr] of m) {
      arr.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return m;
  }, [calendarData?.lessons]);

  const attendanceByLessonId = useMemo(() => {
    const m = new Map<string, NonNullable<StudentCalendarMonth['attendances']>[number]>();
    for (const a of calendarData?.attendances ?? []) {
      m.set(a.lesson.id, a);
    }
    return m;
  }, [calendarData?.attendances]);

  const plannedByDate = useMemo(() => {
    const m = new Map<string, { id: string; comment: string }>();
    for (const p of calendarData?.plannedAbsences ?? []) {
      m.set(p.date, { id: p.id, comment: p.comment });
    }
    return m;
  }, [calendarData?.plannedAbsences]);

  const now = new Date();

  const handlePreviousMonth = () => {
    onMonthChange(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    onMonthChange(getNextMonth(currentMonth));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const openDay = (date: Date) => {
    const dateStr = formatDateString(date);
    const lessonsOnDay = lessonsByDate.get(dateStr) ?? [];
    if (lessonsOnDay.length === 0) return;
    setSelectedDate(dateStr);
    const planned = plannedByDate.get(dateStr);
    setCommentDraft(planned?.comment ?? '');
    setFormError(null);
  };

  const closeDialog = (open: boolean) => {
    if (!open) {
      setSelectedDate(null);
      setFormError(null);
    }
  };

  const selectedLessons = selectedDate ? (lessonsByDate.get(selectedDate) ?? []) : [];
  const selectedPlanned = selectedDate ? plannedByDate.get(selectedDate) : undefined;
  const selectedAnalysis = selectedDate
    ? analyzeDay(
        selectedDate,
        selectedLessons,
        attendanceByLessonId,
        selectedPlanned,
        now
      )
    : null;

  const handleSubmitPlanned = async () => {
    if (!selectedDate) return;
    const trimmed = commentDraft.trim();
    if (!trimmed) {
      setFormError(t('plannedAbsenceCommentRequired'));
      return;
    }
    setFormError(null);
    try {
      await createPlanned.mutateAsync({ date: selectedDate, comment: trimmed });
      setSelectedDate(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t('plannedAbsenceSaveError'));
    }
  };

  const handleDeletePlanned = async () => {
    if (!selectedPlanned) return;
    try {
      await deletePlanned.mutateAsync(selectedPlanned.id);
      setSelectedDate(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t('plannedAbsenceSaveError'));
    }
  };

  const dayCellClass = (date: Date): string => {
    const dateStr = formatDateString(date);
    const lessonsOnDay = lessonsByDate.get(dateStr) ?? [];
    const planned = plannedByDate.get(dateStr);
    const { kind, hasClass } = analyzeDay(
      dateStr,
      lessonsOnDay,
      attendanceByLessonId,
      planned,
      now
    );

    const base =
      'p-3 sm:p-4 border-2 rounded-lg text-center transition-all min-h-[88px] sm:min-h-[100px] flex flex-col items-center justify-center gap-1';

    if (!hasClass) {
      return cn(base, 'border-transparent bg-slate-50/40 opacity-40 cursor-default');
    }

    switch (kind) {
      case 'futurePlanned':
        return cn(
          base,
          'border-amber-400 bg-amber-50 cursor-pointer hover:bg-amber-100/80',
        );
      case 'futureOpen':
        // Green border for scheduled (future) class days.
        return cn(
          base,
          'border-green-500 bg-white cursor-pointer hover:bg-green-50/60',
        );
      case 'pastPresent':
        return cn(
          base,
          'border-emerald-500 bg-emerald-50 cursor-pointer hover:bg-emerald-100/70',
        );
      case 'pastAbsent':
        return cn(
          base,
          'border-red-500 bg-red-50 cursor-pointer hover:bg-red-100/70',
        );
      case 'pastMixed':
        return cn(
          base,
          'border-orange-400 bg-orange-50 cursor-pointer hover:bg-orange-100/70',
        );
      case 'pastUnmarked':
        return cn(
          base,
          'border-slate-300 bg-slate-100 cursor-pointer hover:bg-slate-200/60',
        );
      default:
        return cn(base, 'cursor-default');
    }
  };

  const dayDot = (date: Date) => {
    const dateStr = formatDateString(date);
    const lessonsOnDay = lessonsByDate.get(dateStr) ?? [];
    const planned = plannedByDate.get(dateStr);
    const { kind, hasClass } = analyzeDay(
      dateStr,
      lessonsOnDay,
      attendanceByLessonId,
      planned,
      now
    );
    if (!hasClass) return null;

    if (kind === 'futurePlanned') {
      return <div className="w-2 h-2 rounded-full bg-amber-500" title={t('plannedAbsence')} />;
    }
    if (kind === 'futureOpen') {
      return <div className="w-2 h-2 rounded-full bg-green-400" />;
    }
    if (kind === 'pastPresent') {
      return <div className="w-2 h-2 rounded-full bg-emerald-600" />;
    }
    if (kind === 'pastAbsent') {
      return <div className="w-2 h-2 rounded-full bg-red-600" />;
    }
    if (kind === 'pastMixed') {
      return <div className="w-2 h-2 rounded-full bg-orange-500" />;
    }
    if (kind === 'pastUnmarked') {
      return <div className="w-2 h-2 rounded-full bg-slate-400" />;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            disabled={isLoading}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 min-w-[180px] sm:min-w-[200px] text-center">
            {formatMonthDisplay(currentMonth)}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={isLoading}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={handleToday} disabled={isLoading} type="button" className="self-center sm:self-auto">
          {tCommon('today')}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="text-center text-xs sm:text-sm font-semibold text-slate-700 py-2">
            {day}
          </div>
        ))}

        {monthDates.map((date, idx) => {
          const isInCurrentMonth = isCurrentMonth(date, currentMonth);
          const isTodayDate = isToday(date);
          const dateStr = formatDateString(date);
          const lessonsOnDay = lessonsByDate.get(dateStr) ?? [];
          const hasClass = lessonsOnDay.length > 0;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => openDay(date)}
              disabled={!hasClass || isLoading}
              className={cn(
                dayCellClass(date),
                !isInCurrentMonth && hasClass && 'opacity-60',
                !isInCurrentMonth && !hasClass && 'opacity-30',
                isTodayDate && 'shadow-[inset_0_0_0_2px_rgba(59,130,246,0.35)]'
              )}
            >
              <span className="text-sm font-semibold text-slate-900">{date.getDate()}</span>
              {dayDot(date)}
              {hasClass && lessonsOnDay.length > 1 && (
                <span className="text-[10px] text-slate-500">{lessonsOnDay.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border-2 border-green-500 shrink-0" />
          <span>{t('legendClassDay')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-600 shrink-0" />
          <span>{t('present')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600 shrink-0" />
          <span>{t('absent')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
          <span>{t('plannedAbsence')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400 shrink-0" />
          <span>{t('legendNotMarked')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-300 shrink-0 opacity-50" />
          <span>{t('noLesson')}</span>
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                new Date(selectedDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </DialogTitle>
          </DialogHeader>

          {selectedAnalysis?.hasClass && selectedLessons.length > 0 && (
            <div className="space-y-4 mt-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">{t('scheduledSessions')}</p>
                {selectedLessons.map((lesson) => {
                  const att = attendanceByLessonId.get(lesson.id);
                  const lessonTime = new Date(lesson.scheduledAt);
                  const ended = lessonTime <= now;
                  return (
                    <div key={lesson.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{lesson.group.name}</span>
                        {!ended && (
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            {t('upcoming')}
                          </span>
                        )}
                        {ended && att && (
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              att.isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            )}
                          >
                            {att.isPresent ? t('present') : t('absent')}
                          </span>
                        )}
                        {ended && !att && (
                          <span className="text-xs font-medium text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                            {t('legendNotMarked')}
                          </span>
                        )}
                      </div>
                      {lesson.topic && <p className="text-sm text-slate-600">{lesson.topic}</p>}
                      <p className="text-xs text-slate-500 mt-1">
                        {lessonTime.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {att && !att.isPresent && att.absenceType && (
                        <p className="text-xs text-slate-500 mt-1">
                          {att.absenceType === 'JUSTIFIED' ? t('justified') : t('unjustified')}
                        </p>
                      )}
                      {att?.note && <p className="text-xs text-slate-600 mt-1">{att.note}</p>}
                    </div>
                  );
                })}
              </div>

              {selectedAnalysis.canReportAbsence && (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-800">{t('reportFutureAbsence')}</p>
                  {selectedPlanned && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      {t('plannedAbsenceNote')}: {selectedPlanned.comment}
                    </p>
                  )}
                  <label className="block text-xs font-medium text-slate-600">{t('commentOrReason')}</label>
                  <textarea
                    className="w-full min-h-[88px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder={t('plannedAbsencePlaceholder')}
                    disabled={createPlanned.isPending || deletePlanned.isPending}
                  />
                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={handleSubmitPlanned}
                      disabled={createPlanned.isPending || deletePlanned.isPending}
                    >
                      {selectedPlanned ? t('updatePlannedAbsence') : t('savePlannedAbsence')}
                    </Button>
                    {selectedPlanned && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeletePlanned}
                        disabled={createPlanned.isPending || deletePlanned.isPending}
                      >
                        {t('cancelPlannedAbsence')}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!selectedAnalysis.canReportAbsence && (
                <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">{t('pastDayReadOnly')}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
