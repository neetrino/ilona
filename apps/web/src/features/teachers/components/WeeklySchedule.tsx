'use client';

import { useState, useEffect } from 'react';
import { Input, Label, Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface TimeRange {
  start: string;
  end: string;
}

export type WeeklySchedule = {
  [K in DayOfWeek]?: TimeRange[];
};

interface WeeklyScheduleProps {
  value?: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
  error?: string;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MON', label: 'Monday' },
  { key: 'TUE', label: 'Tuesday' },
  { key: 'WED', label: 'Wednesday' },
  { key: 'THU', label: 'Thursday' },
  { key: 'FRI', label: 'Friday' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN', label: 'Sunday' },
];

export function WeeklySchedule({ value, onChange, error }: WeeklyScheduleProps) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(value || {});
  const [dayErrors, setDayErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (value) {
      setSchedule(value);
    }
  }, [value]);

  const updateSchedule = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule);
    onChange(newSchedule);
  };

  const toggleDay = (day: DayOfWeek) => {
    const newSchedule = { ...schedule };
    if (newSchedule[day]) {
      delete newSchedule[day];
    } else {
      newSchedule[day] = [{ start: '09:00', end: '18:00' }];
    }
    updateSchedule(newSchedule);
    // Clear error for this day when toggled
    setDayErrors((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  };

  const addTimeRange = (day: DayOfWeek) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) {
      newSchedule[day] = [];
    }
    newSchedule[day] = [...(newSchedule[day] || []), { start: '09:00', end: '18:00' }];
    updateSchedule(newSchedule);
  };

  const removeTimeRange = (day: DayOfWeek, index: number) => {
    const newSchedule = { ...schedule };
    if (newSchedule[day]) {
      const ranges = [...newSchedule[day]];
      ranges.splice(index, 1);
      if (ranges.length === 0) {
        delete newSchedule[day];
      } else {
        newSchedule[day] = ranges;
      }
    }
    updateSchedule(newSchedule);
    // Clear error for this day when range is removed
    setDayErrors((prev) => {
      const next = { ...prev };
      delete next[`${day}-${index}`];
      return next;
    });
  };

  const updateTimeRange = (day: DayOfWeek, index: number, field: 'start' | 'end', time: string) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) {
      newSchedule[day] = [];
    }
    const ranges = [...(newSchedule[day] || [])];
    ranges[index] = { ...ranges[index], [field]: time };
    newSchedule[day] = ranges;
    updateSchedule(newSchedule);

    // Validate this specific range
    const range = ranges[index];
    const errorKey = `${day}-${index}`;
    if (range.start && range.end) {
      if (range.start >= range.end) {
        setDayErrors((prev) => ({
          ...prev,
          [errorKey]: 'Start time must be before end time',
        }));
      } else {
        // Check for overlaps with other ranges on the same day
        const hasOverlap = ranges.some((r, i) => {
          if (i === index) return false;
          return (
            (r.start < range.end && r.end > range.start) ||
            (range.start < r.end && range.end > r.start)
          );
        });
        if (hasOverlap) {
          setDayErrors((prev) => ({
            ...prev,
            [errorKey]: 'Time ranges cannot overlap',
          }));
        } else {
          setDayErrors((prev) => {
            const next = { ...prev };
            delete next[errorKey];
            return next;
          });
        }
      }
    }
  };

  const hasActiveDays = Object.keys(schedule).length > 0;
  const _hasErrors = Object.keys(dayErrors).length > 0 || !!error;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Working Hours Schedule</Label>
        <p className="text-sm text-slate-500 mt-1">
          Select the days the teacher works and set their working hours for each day.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {DAYS.map(({ key, label }) => {
          const isActive = !!schedule[key];
          const ranges = schedule[key] || [];
          const dayHasErrors = Object.keys(dayErrors).some((k) => k.startsWith(key));

          return (
            <div
              key={key}
              className={cn(
                'border rounded-lg p-4 transition-colors',
                isActive ? 'border-primary/30 bg-primary/10' : 'border-slate-200 bg-white',
                dayHasErrors && 'border-red-300 bg-red-50/30'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleDay(key)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className={cn('font-medium', isActive ? 'text-slate-800' : 'text-slate-500')}>
                    {label}
                  </span>
                </label>
                {isActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeRange(key)}
                    className="text-xs"
                  >
                    + Add Time Range
                  </Button>
                )}
              </div>

              {isActive && (
                <div className="space-y-2 ml-6">
                  {ranges.map((range, index) => {
                    const errorKey = `${key}-${index}`;
                    const rangeError = dayErrors[errorKey];

                    return (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`${key}-${index}-start`} className="text-xs text-slate-600">
                              Start
                            </Label>
                            <Input
                              id={`${key}-${index}-start`}
                              type="time"
                              value={range.start}
                              onChange={(e) => updateTimeRange(key, index, 'start', e.target.value)}
                              error={rangeError}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`${key}-${index}-end`} className="text-xs text-slate-600">
                              End
                            </Label>
                            <Input
                              id={`${key}-${index}-end`}
                              type="time"
                              value={range.end}
                              onChange={(e) => updateTimeRange(key, index, 'end', e.target.value)}
                              error={rangeError}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        {ranges.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTimeRange(key, index)}
                            className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
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
                    );
                  })}
                  {ranges.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No time ranges set for this day</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasActiveDays && (
        <p className="text-sm text-slate-400 italic text-center py-2">
          Select at least one day to set working hours
        </p>
      )}
    </div>
  );
}








