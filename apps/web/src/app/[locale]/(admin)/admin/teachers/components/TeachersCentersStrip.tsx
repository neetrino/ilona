'use client';

import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import { cn, lightenColor, getContrastColor } from '@/shared/lib/utils';

interface TeachersCentersStripProps {
  centers: Center[];
  teachersByCenter: Record<string, Teacher[]>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
}

export function TeachersCentersStrip({
  centers,
  teachersByCenter,
  activeCenterTabId,
  onSelectCenter,
}: TeachersCentersStripProps) {
  const hasUnassigned = (teachersByCenter.unassigned?.length || 0) > 0;

  if (centers.length === 0 && !hasUnassigned) {
    return null;
  }

  return (
    <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50/70 to-white px-3 pt-3">
      <div className="overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex min-w-max items-center gap-2.5" role="tablist" aria-label="Centers">
          {centers.map((center) => {
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
                onClick={() => onSelectCenter(center.id)}
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
                    isActive ? 'shadow-sm' : 'group-hover:bg-slate-200 group-hover:text-slate-700'
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

          {hasUnassigned ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeCenterTabId === 'unassigned'}
              id="center-tab-unassigned"
              onClick={() => onSelectCenter('unassigned')}
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
          ) : null}
        </nav>
      </div>
    </div>
  );
}
