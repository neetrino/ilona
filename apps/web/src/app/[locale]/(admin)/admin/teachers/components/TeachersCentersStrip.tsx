'use client';

import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import type { useTranslations } from 'next-intl';
import { cn, lightenColor, getContrastColor } from '@/shared/lib/utils';
import { TeachersUniqueTotalStat } from './TeachersUniqueTotalStat';

interface TeachersCentersStripProps {
  centers: Center[];
  teachersByCenter: Record<string, Teacher[]>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
  uniqueTeachersCount: number;
  isLoading: boolean;
  t: ReturnType<typeof useTranslations<'teachers'>>;
  unassignedLabel: string;
}

export function TeachersCentersStrip({
  centers,
  teachersByCenter,
  activeCenterTabId,
  onSelectCenter,
  uniqueTeachersCount,
  isLoading,
  t,
  unassignedLabel,
}: TeachersCentersStripProps) {
  const hasUnassigned = (teachersByCenter.unassigned?.length || 0) > 0;
  const hasCenterTabs = centers.length > 0 || hasUnassigned;

  return (
    <div className="border-b border-[rgba(14,14,16,0.07)] bg-gradient-to-b from-[#fafafa] to-white px-3 pt-3">
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:gap-3">
        <TeachersUniqueTotalStat count={uniqueTeachersCount} isLoading={isLoading} t={t} />

        {hasCenterTabs ? (
          <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <nav className="flex min-w-max items-center gap-2.5" role="tablist" aria-label={t('centers')}>
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
                      'group inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-all duration-200',
                      'focus:outline-none focus-visible:outline-none focus-visible:ring-0',
                      'active:scale-[0.985]',
                      isActive
                        ? ''
                        : 'bg-white text-[#3b3b40] hover:-translate-y-px hover:bg-[#fafafa] hover:text-[#3b3b40] hover:shadow-sm'
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
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[0.625rem] font-medium uppercase tracking-[0.08em]',
                          isActive ? 'opacity-80' : 'text-[#64748b]'
                        )}
                      >
                        {t('centerTeachersCount')}
                      </span>
                      <span
                        className={cn(
                          'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                          isActive ? 'shadow-sm' : 'group-hover:bg-[#f6f6f7] group-hover:text-[#3b3b40]'
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
                    'group inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-all duration-200',
                    'focus:outline-none focus-visible:outline-none focus-visible:ring-0',
                    'active:scale-[0.985]',
                    activeCenterTabId === 'unassigned'
                      ? 'bg-[#1010a3] text-white'
                      : 'bg-[#f6f6f7] text-[#3b3b40] hover:-translate-y-px hover:bg-[#f6f6f7] hover:shadow-sm'
                  )}
                >
                  <span className="max-w-[12rem] truncate font-semibold tracking-[0.01em] sm:max-w-[14rem]">
                    {unassignedLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-[0.625rem] font-medium uppercase tracking-[0.08em]',
                        activeCenterTabId === 'unassigned' ? 'opacity-80' : 'text-[#64748b]'
                      )}
                    >
                      {t('centerTeachersCount')}
                    </span>
                    <span
                      className={cn(
                        'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                        activeCenterTabId === 'unassigned'
                          ? 'bg-white/20 text-white'
                          : 'bg-[#e8e8ec] text-[#3b3b40]'
                      )}
                    >
                      {teachersByCenter.unassigned?.length || 0}
                    </span>
                  </span>
                </button>
              ) : null}
            </nav>
          </div>
        ) : null}
      </div>
    </div>
  );
}
