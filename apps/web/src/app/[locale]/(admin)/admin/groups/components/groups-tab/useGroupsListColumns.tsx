'use client';

import { useMemo } from 'react';
import type { useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  getGroupOccupancyMeta,
  GroupIconDisplay,
  getGroupTeachersForDisplay,
  GroupTeachersAlignedDisplay,
  type Group,
} from '@/features/groups';
import { SelectAllCheckbox } from './SelectAllCheckbox';

function getOccupancyLabelKey(
  status: ReturnType<typeof getGroupOccupancyMeta>['status'],
): 'occupancyFull' | 'occupancyFilling' | 'occupancyRed' {
  if (status === 'full') return 'occupancyFull';
  if (status === 'filling') return 'occupancyFilling';
  return 'occupancyRed';
}

interface UseGroupsListColumnsParams {
  allGroupsSelected: boolean;
  someGroupsSelected: boolean;
  handleSelectAllGroups: () => void;
  deletePending: boolean;
  isLoading: boolean;
  selectedGroupIds: Set<string>;
  handleToggleSelectGroup: (groupId: string) => void;
  openStudentsModal: (groupId: string) => void;
  t: ReturnType<typeof useTranslations<'groups'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
}

export function useGroupsListColumns({
  allGroupsSelected,
  someGroupsSelected,
  handleSelectAllGroups,
  deletePending,
  isLoading,
  selectedGroupIds,
  handleToggleSelectGroup,
  openStudentsModal,
  t,
  tCommon,
}: UseGroupsListColumnsParams) {
  return useMemo(
    () => [
      {
        key: 'checkbox',
        header: (
          <SelectAllCheckbox
            checked={allGroupsSelected}
            indeterminate={someGroupsSelected}
            onChange={handleSelectAllGroups}
            disabled={deletePending || isLoading}
            ariaLabel={t('selectAll')}
          />
        ),
        render: (group: Group) => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            checked={selectedGroupIds.has(group.id)}
            onChange={() => handleToggleSelectGroup(group.id)}
            onClick={(e) => e.stopPropagation()}
            disabled={deletePending || isLoading}
            aria-label={t('selectGroupAria', { name: group.name })}
          />
        ),
        className: '!pl-4 !pr-2 w-12',
      },
      {
        key: 'center',
        header: tCommon('center'),
        render: (group: Group) => (
          <span className="text-[#3b3b40]">{group.center?.name || '—'}</span>
        ),
      },
      {
        key: 'name',
        header: tCommon('group'),
        render: (group: Group) => (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0" aria-hidden>
              <GroupIconDisplay iconKey={group.iconKey} size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#3b3b40]">{group.name}</p>
              <p className="text-sm text-[#8b8b90]">{group.description || t('noDescription')}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'level',
        header: tCommon('level'),
        render: (group: Group) =>
          group.level ? (
            <Badge variant="info">{group.level}</Badge>
          ) : (
            <span className="text-[#8b8b90]">—</span>
          ),
      },
      {
        key: 'teacher',
        header: tCommon('teacher'),
        render: (group: Group) => {
          const teachersForDisplay = getGroupTeachersForDisplay(group);
          return (
            <GroupTeachersAlignedDisplay
              teachers={teachersForDisplay}
              variant="list"
              emptyLabel={tCommon('notAssigned')}
            />
          );
        },
      },
      {
        key: 'students',
        header: t('studentsCount'),
        className: 'text-center',
        render: (group: Group) => {
          const count = group._count?.students || 0;
          return (
            <div className="text-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openStudentsModal(group.id);
                }}
                className="underline decoration-[#8b8b90] underline-offset-2 hover:decoration-[#1010a3] hover:text-[#1010a3] font-medium text-[#3b3b40] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-1 rounded inline"
                title={t('viewStudentsInGroup')}
              >
                {count}/{group.maxStudents}
              </button>
            </div>
          );
        },
      },
      {
        key: 'status',
        header: tCommon('status'),
        className: 'text-center',
        render: (group: Group) => {
          const count = group._count?.students || 0;
          const occupancy = getGroupOccupancyMeta(count);
          const dotColorClass =
            occupancy.status === 'full'
              ? 'bg-green-500'
              : occupancy.status === 'filling'
                ? 'bg-yellow-500'
                : 'bg-red-500';

          return (
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn('inline-flex h-2.5 w-2.5 rounded-full', dotColorClass)}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-[#3b3b40]">
                {t(getOccupancyLabelKey(occupancy.status))}
              </span>
            </div>
          );
        },
      },
    ],
    [
      allGroupsSelected,
      someGroupsSelected,
      handleSelectAllGroups,
      deletePending,
      isLoading,
      selectedGroupIds,
      handleToggleSelectGroup,
      t,
      tCommon,
      openStudentsModal,
    ],
  );
}
