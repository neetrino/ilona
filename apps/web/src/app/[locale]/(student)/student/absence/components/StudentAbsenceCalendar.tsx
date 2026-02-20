'use client';

import { useState } from 'react';
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
import type { StudentAttendanceHistory } from '@/features/attendance';

interface StudentAbsenceCalendarProps {
  attendanceData: StudentAttendanceHistory | undefined;
  isLoading: boolean;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

interface DayStatus {
  hasLesson: boolean;
  isPresent: boolean | null; // null means no lesson
  hasAbsence: boolean;
  lessons: Array<{
    id: string;
    scheduledAt: string;
    topic?: string;
    group: { name: string };
    isPresent: boolean;
    absenceType?: 'JUSTIFIED' | 'UNJUSTIFIED' | null;
  }>;
}

export function StudentAbsenceCalendar({
  attendanceData,
  isLoading,
  currentMonth,
  onMonthChange,
}: StudentAbsenceCalendarProps) {
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
  const monthDates = getMonthDates(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group attendance by date
  const attendanceByDate = new Map<string, DayStatus>();
  
  if (attendanceData?.attendances) {
    attendanceData.attendances.forEach((attendance) => {
      const lessonDate = new Date(attendance.lesson.scheduledAt);
      const dateStr = formatDateString(lessonDate);
      
      if (!attendanceByDate.has(dateStr)) {
        attendanceByDate.set(dateStr, {
          hasLesson: true,
          isPresent: null,
          hasAbsence: false,
          lessons: [],
        });
      }
      
      const dayStatus = attendanceByDate.get(dateStr)!;
      dayStatus.lessons.push({
        id: attendance.lesson.id,
        scheduledAt: attendance.lesson.scheduledAt,
        topic: attendance.lesson.topic,
        group: attendance.lesson.group,
        isPresent: attendance.isPresent,
        absenceType: attendance.absenceType,
      });
      
      // If any lesson has absence, mark the day as having absence
      if (!attendance.isPresent) {
        dayStatus.hasAbsence = true;
      }
      
      // Set isPresent: true only if all lessons are present
      if (dayStatus.isPresent === null) {
        dayStatus.isPresent = attendance.isPresent;
      } else {
        dayStatus.isPresent = dayStatus.isPresent && attendance.isPresent;
      }
    });
  }

  const getDayStatus = (date: Date): DayStatus => {
    const dateStr = formatDateString(date);
    return attendanceByDate.get(dateStr) || {
      hasLesson: false,
      isPresent: null,
      hasAbsence: false,
      lessons: [],
    };
  };

  const handlePreviousMonth = () => {
    onMonthChange(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    onMonthChange(getNextMonth(currentMonth));
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const handleDayClick = (date: Date) => {
    const status = getDayStatus(date);
    if (status.hasLesson) {
      setSelectedDate(formatDateString(date));
    }
  };

  const selectedDayStatus = selectedDate ? getDayStatus(new Date(selectedDate)) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 min-w-[200px] text-center">
            {formatMonthDisplay(currentMonth)}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={handleToday} disabled={isLoading}>
          {tCommon('today')}
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div
            key={idx}
            className="text-center text-sm font-semibold text-slate-700 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {monthDates.map((date, idx) => {
          const isInCurrentMonth = isCurrentMonth(date, currentMonth);
          const isTodayDate = isToday(date);
          const status = getDayStatus(date);

          // Determine day styling
          let dayClassName = 'p-4 border-2 rounded-lg text-center transition-all min-h-[100px] flex flex-col items-center justify-center';
          
          if (!isInCurrentMonth) {
            dayClassName += ' opacity-40';
          }
          
          if (!status.hasLesson) {
            // No lesson - dimmed/disabled style
            dayClassName += ' border-slate-200 bg-slate-50 cursor-default';
          } else {
            // Has lesson - interactive
            dayClassName += ' cursor-pointer hover:border-primary/40 hover:bg-primary/5';
            
            if (status.hasAbsence) {
              // Has absence - red indicator
              dayClassName += ' border-red-300 bg-red-50';
            } else if (status.isPresent) {
              // All present - green indicator
              dayClassName += ' border-green-300 bg-green-50';
            } else {
              // Has lesson but unclear status
              dayClassName += ' border-slate-300 bg-slate-50';
            }
          }

          if (isTodayDate) {
            dayClassName += ' ring-2 ring-primary/30';
          }

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(date)}
              disabled={!status.hasLesson || isLoading}
              className={cn(dayClassName)}
            >
              <div className="text-sm font-semibold text-slate-900 mb-1">
                {date.getDate()}
              </div>
              {status.hasLesson && (
                <div className="flex flex-col gap-1 items-center">
                  {status.hasAbsence ? (
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  ) : status.isPresent ? (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  ) : null}
                  {status.lessons.length > 1 && (
                    <span className="text-xs text-slate-500">
                      {status.lessons.length}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-slate-600">{t('present')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600">{t('absent')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-300" />
          <span className="text-slate-600">{t('noLesson') || 'No lesson'}</span>
        </div>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </DialogTitle>
          </DialogHeader>
          {selectedDayStatus && selectedDayStatus.lessons.length > 0 && (
            <div className="space-y-3 mt-4">
              {selectedDayStatus.lessons.map((lesson) => {
                const lessonDate = new Date(lesson.scheduledAt);
                return (
                  <div
                    key={lesson.id}
                    className="p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">
                        {lesson.group.name}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          lesson.isPresent
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {lesson.isPresent ? t('present') : t('absent')}
                      </span>
                    </div>
                    {lesson.topic && (
                      <p className="text-sm text-slate-600 mb-1">{lesson.topic}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {lessonDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {!lesson.isPresent && lesson.absenceType && (
                      <p className="text-xs text-slate-500 mt-1">
                        {lesson.absenceType === 'JUSTIFIED'
                          ? t('justified')
                          : t('unjustified')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

