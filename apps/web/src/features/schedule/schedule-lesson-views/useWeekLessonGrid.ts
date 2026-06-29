'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lesson } from '@/features/lessons';
import { formatScheduleDate, scheduleDateKeyFromIso } from '@/features/schedule/schedule-dates';
import { SCHEDULE_END_HOUR, SCHEDULE_START_HOUR } from './schedule-lesson-views.constants';
import { getLessonTimeBounds } from './schedule-lesson-views.util';
import type { WeekLessonGridProps } from './schedule-lesson-views.types';

export function useWeekLessonGrid({ weekDates, lessons }: Pick<WeekLessonGridProps, 'weekDates' | 'lessons'>) {
  const todayWeekIndex = useMemo(() => {
    const todayKey = formatScheduleDate(new Date());
    const idx = weekDates.findIndex((date) => formatScheduleDate(date) === todayKey);
    return idx >= 0 ? idx : 0;
  }, [weekDates]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(todayWeekIndex);

  useEffect(() => {
    setSelectedDayIndex(todayWeekIndex);
  }, [todayWeekIndex]);

  const { slots, cells, totalLessons } = useMemo(() => {
    const groupedByDay = weekDates.map((date) => {
      const dayKey = formatScheduleDate(date);
      return lessons
        .filter((lesson) => scheduleDateKeyFromIso(lesson.scheduledAt) === dayKey)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });

    const timeline = Array.from(
      { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
      (_, idx) => (SCHEDULE_START_HOUR + idx) * 60,
    );

    const map = new Map<string, Lesson[]>();
    groupedByDay.forEach((dayLessons, dayIdx) => {
      for (const lesson of dayLessons) {
        const boundsData = getLessonTimeBounds(lesson);
        if (!boundsData) continue;
        const rowHour = Math.floor(boundsData.start / 60) * 60;
        const key = `${dayIdx}|${rowHour}`;
        const bucket = map.get(key) ?? [];
        bucket.push(lesson);
        map.set(key, bucket);
      }
    });

    return {
      slots: timeline,
      cells: map,
      totalLessons: groupedByDay.reduce((sum, day) => sum + day.length, 0),
    };
  }, [lessons, weekDates]);

  const lessonsByDay = useMemo(
    () =>
      weekDates.map((date) => {
        const dayKey = formatScheduleDate(date);
        return lessons
          .filter((lesson) => scheduleDateKeyFromIso(lesson.scheduledAt) === dayKey)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      }),
    [lessons, weekDates],
  );

  const selectedDate = weekDates[selectedDayIndex] ?? weekDates[0];
  const selectedDayLessons = lessonsByDay[selectedDayIndex] ?? [];

  return {
    selectedDayIndex,
    setSelectedDayIndex,
    slots,
    cells,
    totalLessons,
    selectedDate,
    selectedDayLessons,
  };
}
