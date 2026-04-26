'use client';

import { useMemo } from 'react';
import type { Group, GroupScheduleEntry } from '@/features/groups/types';
import { GroupIconDisplay } from '@/features/groups';

const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Convert JS Sunday=0 indexing to Mon=0 ordering used in the grid. */
function toMondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** Keep exact HH:mm format to avoid shifted lessons in the grid. */
function normalizeSlot(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface ScheduleCellEntry {
  group: Group;
  entry: GroupScheduleEntry;
}

interface ScheduleGridProps {
  groups: Group[];
  isLoading?: boolean;
  /** When provided, restrict the time-axis to this fixed list (e.g. business hours). */
  fixedSlots?: string[];
  /** Fit full weekly grid into container width without horizontal scroll. */
  fitToContainer?: boolean;
}

/**
 * Renders a Mon-Sun × time-slot grid populated from the persisted
 * `Group.schedule` JSON. Each cell shows the group name plus its
 * assigned (and substitute) teacher.
 */
export function ScheduleGrid({
  groups,
  isLoading,
  fixedSlots,
  fitToContainer = false,
}: ScheduleGridProps) {
  const { slots, cells } = useMemo(() => {
    const buckets = new Map<string, ScheduleCellEntry[]>();
    const slotSet = new Set<string>();

    for (const group of groups) {
      if (!group.isActive) continue;
      const schedule = group.schedule ?? [];
      for (const entry of schedule) {
        const dayIdx = toMondayIndex(entry.dayOfWeek);
        if (dayIdx < 0 || dayIdx > 6) continue;
        const slot = normalizeSlot(entry.startTime);
        slotSet.add(slot);
        const key = `${dayIdx}|${slot}`;
        const list = buckets.get(key) ?? [];
        list.push({ group, entry });
        buckets.set(key, list);
      }
    }

    const baseSlots = fixedSlots ?? Array.from(slotSet).sort();
    return { slots: baseSlots, cells: buckets };
  }, [groups, fixedSlots]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 8 * 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-16 rounded bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
        No active groups have a configured schedule yet. Add a weekly schedule
        from the Groups page to see it here.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className={fitToContainer ? 'px-1 pb-1' : 'overflow-x-auto'}>
        <table className={`w-full border-collapse ${fitToContainer ? 'table-fixed' : ''}`}>
          <thead>
            <tr>
              <th
                className={`sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 text-left font-semibold uppercase tracking-wide text-slate-500 ${fitToContainer ? 'w-16 px-2 py-2 text-[10px]' : 'w-24 px-3 py-2 text-xs'}`}
              >
                Time
              </th>
              {DAY_LABELS.map((day) => (
                <th
                  key={day}
                  className={`bg-slate-50 border-b border-slate-200 text-left font-semibold uppercase tracking-wide text-slate-500 ${fitToContainer ? 'px-2 py-2 text-[10px]' : 'px-3 py-2 text-xs'}`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="align-top">
                <td
                  className={`sticky left-0 z-10 bg-white border-b border-r border-slate-100 font-medium text-slate-600 ${fitToContainer ? 'px-2 py-2 text-xs' : 'px-3 py-3 text-sm'}`}
                >
                  {slot}
                </td>
                {DAY_LABELS.map((_, dayIdx) => {
                  const key = `${dayIdx}|${slot}`;
                  const items = cells.get(key) ?? [];
                  const isLastDayColumn = dayIdx === DAY_LABELS.length - 1;
                  return (
                    <td
                      key={key}
                      className={`border-b border-slate-100 align-top ${isLastDayColumn ? '' : 'border-r border-slate-100'} ${fitToContainer ? 'px-1.5 py-1.5' : 'px-2 py-2 min-w-[160px]'}`}
                    >
                      {items.length === 0 ? (
                        <div className={fitToContainer ? 'h-10' : 'h-12'} aria-hidden />
                      ) : (
                        <div className={fitToContainer ? 'space-y-1' : 'space-y-1.5'}>
                          {items.map(({ group, entry }) => (
                            <ScheduleCard
                              key={`${group.id}-${entry.startTime}`}
                              group={group}
                              entry={entry}
                              compact={fitToContainer}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ScheduleCardProps {
  group: Group;
  entry: GroupScheduleEntry;
  compact?: boolean;
}

function ScheduleCard({ group, entry, compact = false }: ScheduleCardProps) {
  const teacherName = group.teacher
    ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`.trim()
    : 'No teacher';
  const subName = group.substituteTeacher
    ? `${group.substituteTeacher.user.firstName} ${group.substituteTeacher.user.lastName}`.trim()
    : null;

  return (
    <div
      className={`rounded-md border border-primary/15 bg-primary/5 leading-tight ${compact ? 'px-1.5 py-1 text-[10px]' : 'px-2 py-1.5 text-xs'}`}
    >
      <div className="flex min-w-0 items-center gap-1 font-semibold text-slate-800" title={group.name}>
        <GroupIconDisplay
          iconKey={group.iconKey}
          size={compact ? 12 : 14}
          className="shrink-0 text-slate-600"
        />
        <span className="truncate">
          {group.name}
          {group.level ? (
            <span className="text-slate-500 font-normal"> · {group.level}</span>
          ) : null}
        </span>
      </div>
      <div className="text-slate-600 truncate" title={teacherName}>
        {teacherName}
      </div>
      {subName && (
        <div className="text-amber-700 truncate" title={`Substitute: ${subName}`}>
          Sub: {subName}
        </div>
      )}
      <div className="text-slate-400">
        {entry.startTime}–{entry.endTime}
      </div>
    </div>
  );
}
