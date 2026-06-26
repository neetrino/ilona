'use client';

import type { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { getContrastColor, lightenColor } from '@/shared/lib/utils';
import type { CenterWithCount } from '@/features/centers';
import { GroupsUniqueTotalStat } from './GroupsUniqueTotalStat';

interface GroupsBranchTabsStripProps {
  centers: CenterWithCount[];
  activeCenterId: string | null;
  totalGroupsAcrossCenters: number;
  isLoading: boolean;
  onCenterSelect: (centerId: string) => void;
  t: ReturnType<typeof useTranslations<'groups'>>;
  tabIdPrefix?: string;
}

export function GroupsBranchTabsStrip({
  centers,
  activeCenterId,
  totalGroupsAcrossCenters,
  isLoading,
  onCenterSelect,
  t,
  tabIdPrefix = 'branch-tab',
}: GroupsBranchTabsStripProps) {
  if (isLoading) {
    return <div className="py-4 text-sm text-[#8b8b90]">{t('loadingBranches')}</div>;
  }

  if (centers.length === 0) {
    return <div className="py-4 text-sm text-[#8b8b90]">{t('noBranchesCreateCenter')}</div>;
  }

  return (
    <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:gap-3">
      <GroupsUniqueTotalStat
        count={totalGroupsAcrossCenters}
        isLoading={isLoading}
        t={t}
      />
      <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav
          className="flex min-w-max items-center gap-2.5"
          role="tablist"
          aria-label={t('branches')}
        >
          {centers.map((center) => {
            const count = center._count?.groups ?? 0;
            const isActive = activeCenterId === center.id;
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
                id={`${tabIdPrefix}-${center.id}`}
                onClick={() => onCenterSelect(center.id)}
                className={cn(
                  'group inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/60 focus-visible:ring-offset-2',
                  'active:scale-[0.985]',
                  isActive
                    ? ''
                    : 'border-[rgba(14,14,16,0.07)] bg-white text-[#3b3b40] hover:-translate-y-px hover:border-[rgba(14,14,16,0.12)] hover:bg-[#fafafa] hover:text-[#3b3b40] hover:shadow-sm',
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
                    isActive ? '' : 'group-hover:bg-[#f6f6f7] group-hover:text-[#3b3b40]',
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
        </nav>
      </div>
    </div>
  );
}
