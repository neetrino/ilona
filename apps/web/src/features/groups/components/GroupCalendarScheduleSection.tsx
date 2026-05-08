'use client';

import { useMemo } from 'react';
import { Label } from '@/shared/components/ui';
import type { GroupScheduleEntry } from '../types';
import { GroupScheduleEditor } from './GroupScheduleEditor';
import {
  formatPreviewRow,
  previewLessonOccurrences,
  scheduleSlotsValidationError,
} from '../group-schedule-utils';

export interface GroupCalendarScheduleSectionProps {
  schedule: GroupScheduleEntry[];
  onScheduleChange: (next: GroupScheduleEntry[]) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (next: string) => void;
  onDateToChange: (next: string) => void;
  lessonTopic: string;
  onLessonTopicChange: (next: string) => void;
  lessonDescription: string;
  onLessonDescriptionChange: (next: string) => void;
  disabled?: boolean;
}

export function GroupCalendarScheduleSection({
  schedule,
  onScheduleChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  lessonTopic,
  onLessonTopicChange,
  lessonDescription,
  onLessonDescriptionChange,
  disabled,
}: GroupCalendarScheduleSectionProps) {
  const slotError = schedule.length > 0 ? scheduleSlotsValidationError(schedule) : null;

  const preview = useMemo(() => {
    if (!dateFrom || !dateTo || schedule.length === 0 || slotError) {
      return [];
    }
    return previewLessonOccurrences(schedule, dateFrom, dateTo);
  }, [dateFrom, dateTo, schedule, slotError]);

  const previewSample = preview.slice(0, 12);

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/40 p-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Calendar schedule</Label>
        <p className="text-xs text-slate-500">
          When the group has weekly time slots, lessons are generated in the admin calendar for the date range below.
          Manually deleted generated slots stay skipped until you confirm replacing the schedule.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="schedule-date-from">Start date</Label>
          <input
            id="schedule-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="schedule-date-to">End date</Label>
          <input
            id="schedule-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            disabled={disabled}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="schedule-lesson-topic">Lesson title (optional)</Label>
          <input
            id="schedule-lesson-topic"
            type="text"
            value={lessonTopic}
            onChange={(e) => onLessonTopicChange(e.target.value)}
            disabled={disabled}
            placeholder="e.g. Unit 3 — Past simple"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="schedule-lesson-desc">Lesson description (optional)</Label>
          <textarea
            id="schedule-lesson-desc"
            value={lessonDescription}
            onChange={(e) => onLessonDescriptionChange(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="Notes for generated lessons"
            className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Weekly time slots</Label>
        <GroupScheduleEditor value={schedule} onChange={onScheduleChange} disabled={disabled} />
        {slotError && <p className="text-xs text-red-600">{slotError}</p>}
      </div>

      {preview.length > 0 && !slotError && (
        <div className="space-y-1 rounded-md border border-dashed border-slate-200 bg-white p-2">
          <p className="text-xs font-medium text-slate-700">
            Preview: {preview.length} lesson{preview.length === 1 ? '' : 's'} in range
          </p>
          <ul className="max-h-40 space-y-0.5 overflow-y-auto text-xs text-slate-600">
            {previewSample.map((d, i) => (
              <li key={`${d.getTime()}-${i}`}>{formatPreviewRow(d)}</li>
            ))}
          </ul>
          {preview.length > previewSample.length && (
            <p className="text-xs text-slate-500">…and {preview.length - previewSample.length} more</p>
          )}
        </div>
      )}
    </div>
  );
}
