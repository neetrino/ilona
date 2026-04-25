'use client';

import { useEffect, useMemo, useState } from 'react';
import { TeacherCard } from './TeacherCard';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import { cn, lightenColor, getContrastColor } from '@/shared/lib/utils';

interface TeachersBoardProps {
  teachersByCenter: Record<string, Teacher[]>;
  centersData?: Array<Center>;
  isLoading: boolean;
  searchQuery: string;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
  /** Opens teacher details in CRM-style modal */
  onCardClick?: (teacher: Teacher) => void;
}

export function TeachersBoard({
  teachersByCenter,
  centersData,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onDeactivate,
  onCardClick,
}: TeachersBoardProps) {
  const [activeCenterTabId, setActiveCenterTabId] = useState<string | null>(null);
  const allCenters = centersData || [];

  // Sort centers by name to ensure consistent ordering
  const sortedCenters = useMemo(
    () => [...allCenters].sort((a, b) => a.name.localeCompare(b.name)),
    [allCenters]
  );

  const hasUnassigned = (teachersByCenter.unassigned?.length || 0) > 0;

  useEffect(() => {
    if (sortedCenters.length === 0) {
      setActiveCenterTabId(hasUnassigned ? 'unassigned' : null);
      return;
    }

    const activeStillExists =
      activeCenterTabId === 'unassigned'
        ? hasUnassigned
        : sortedCenters.some((center) => center.id === activeCenterTabId);

    if (activeStillExists) {
      return;
    }

    setActiveCenterTabId(sortedCenters[0].id);
  }, [activeCenterTabId, hasUnassigned, sortedCenters]);

  const selectedTeachers =
    activeCenterTabId === 'unassigned'
      ? teachersByCenter.unassigned || []
      : teachersByCenter[activeCenterTabId || ''] || [];

  const selectedCenter = sortedCenters.find((center) => center.id === activeCenterTabId);
  const panelTitle = activeCenterTabId === 'unassigned' ? 'Unassigned' : selectedCenter?.name || 'Center';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading teachers...</div>
      </div>
    );
  }

  if (allCenters.length === 0 && !hasUnassigned) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">No teachers found.</div>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50/70 to-white px-3 pt-3">
        <div className="overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav
            className="flex min-w-max items-center gap-2.5"
            role="tablist"
            aria-label="Centers"
          >
            {sortedCenters.map((center) => {
              const count = teachersByCenter[center.id]?.length || 0;
              const isActive = activeCenterTabId === center.id;
              const primaryColor = center.colorHex || '#253046';
              const softColor = lightenColor(primaryColor, 0.65);
              const chipColor = lightenColor(primaryColor, 0.45);
              const softBorderColor = lightenColor(primaryColor, 0.35);
              const activeTextColor = getContrastColor(primaryColor) === 'white' ? '#ffffff' : '#0f172a';

              return (
                <button
                  type="button"
                  key={center.id}
                  role="tab"
                  aria-selected={isActive}
                  id={`center-tab-${center.id}`}
                  onClick={() => setActiveCenterTabId(center.id)}
                  className={cn(
                    'group inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
                    'active:scale-[0.985]',
                    isActive
                      ? 'shadow-[0_4px_14px_rgba(15,23,42,0.14)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm'
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: primaryColor,
                          color: activeTextColor,
                          borderColor: primaryColor,
                        }
                      : {
                          backgroundColor: softColor,
                          color: '#334155',
                          borderColor: softBorderColor,
                        }
                  }
                >
                  <span className="max-w-[12rem] truncate font-semibold tracking-[0.01em] sm:max-w-[14rem]">
                    {center.name}
                  </span>
                  <span
                    className={cn(
                      'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                      isActive
                        ? 'shadow-sm'
                        : 'group-hover:bg-slate-200 group-hover:text-slate-700'
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: lightenColor(primaryColor, 0.22),
                            color: activeTextColor,
                          }
                        : {
                            backgroundColor: chipColor,
                            color: '#1e293b',
                          }
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {hasUnassigned && (
              <button
                type="button"
                role="tab"
                aria-selected={activeCenterTabId === 'unassigned'}
                id="center-tab-unassigned"
                onClick={() => setActiveCenterTabId('unassigned')}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
                  'active:scale-[0.985]',
                  activeCenterTabId === 'unassigned'
                    ? 'border-slate-800 bg-slate-800 text-white shadow-[0_4px_14px_rgba(15,23,42,0.14)]'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:-translate-y-px hover:border-slate-300 hover:bg-slate-200 hover:shadow-sm'
                )}
              >
                <span className="max-w-[12rem] truncate font-semibold tracking-[0.01em] sm:max-w-[14rem]">
                  Unassigned
                </span>
                <span
                  className={cn(
                    'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                    activeCenterTabId === 'unassigned'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-300 text-slate-700'
                  )}
                >
                  {teachersByCenter.unassigned?.length || 0}
                </span>
              </button>
            )}
          </nav>
        </div>
      </div>

      <div
        className="p-4 sm:p-5"
        role="tabpanel"
        aria-label={panelTitle}
      >
        {searchQuery &&
        sortedCenters.every((center) => (teachersByCenter[center.id] || []).length === 0) &&
        !hasUnassigned ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">No teachers match your search</div>
          </div>
        ) : !activeCenterTabId ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
            <p className="text-sm text-slate-500">No centers found.</p>
          </div>
        ) : selectedTeachers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            {activeCenterTabId === 'unassigned' ? 'No unassigned teachers' : 'No teachers in this center'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onEdit={() => onEdit(teacher)}
                onDelete={() => onDelete(teacher)}
                onDeactivate={() => onDeactivate(teacher)}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

