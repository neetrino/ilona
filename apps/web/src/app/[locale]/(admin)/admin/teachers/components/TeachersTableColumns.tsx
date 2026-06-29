'use client';

import { Avatar } from '@/shared/components/ui';
import { SelectAllCheckbox } from './SelectAllCheckbox';
import { TeacherBranchMultiSelect } from './TeacherBranchMultiSelect';
import { cn, formatPhoneForDisplay } from '@/shared/lib/utils';
import type { Teacher } from '@/features/teachers';
import { getTeacherCenters, formatLessonRate } from '../utils';
import type { useTranslations } from 'next-intl';

interface TeachersTableColumnsProps {
  t: ReturnType<typeof useTranslations<'teachers'>>;
  tStatus: ReturnType<typeof useTranslations<'status'>>;
  allSelected: boolean;
  someSelected: boolean;
  selectedTeacherIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (teacherId: string) => void;
  onView: (teacher: Teacher) => void;
  onCenterChange: (teacherId: string, centerIds: string[]) => Promise<void>;
  onOpenGroupsModal: (teacher: Teacher, tab: 'groups' | 'subgroups') => void;
  centerOptions: Array<{ id: string; label: string }>;
  isDeleting: boolean;
  isUpdating: boolean;
  isLoading: boolean;
}

export function createTeachersTableColumns({
  t,
  tStatus,
  allSelected,
  someSelected,
  selectedTeacherIds,
  onSelectAll,
  onToggleSelect,
  onView: _onView,
  onCenterChange,
  onOpenGroupsModal,
  centerOptions,
  isDeleting,
  isUpdating,
  isLoading,
}: TeachersTableColumnsProps) {
  return [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={onSelectAll}
          disabled={isDeleting || isUpdating || isLoading}
        />
      ),
      render: (teacher: Teacher) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          checked={selectedTeacherIds.has(teacher.id)}
          onChange={() => onToggleSelect(teacher.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={isDeleting || isUpdating || isLoading}
          aria-label={`Select ${teacher.user?.firstName} ${teacher.user?.lastName}`}
        />
      ),
      className: '!pl-4 !pr-2 !w-12',
    },
    {
      key: 'teacher',
      header: t('title'),
      sortable: true,
      className: '!pl-4 !pr-4 !w-[170px] !min-w-[170px] !max-w-[170px]',
      render: (teacher: Teacher) => {
        const firstName = teacher.user?.firstName || '';
        const lastName = teacher.user?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || '?';
        const phone = formatPhoneForDisplay(teacher.user?.phone, t('noPhoneNumber'));
        const isActive = teacher.user?.status === 'ACTIVE';
        return (
          <div className={cn("flex items-center gap-3", !isActive && "opacity-60")}>
            <Avatar
              src={teacher.user?.avatarUrl}
              name={fullName}
              size="md"
              alt={fullName}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn("font-semibold text-[#3b3b40]", !isActive && "text-[#8b8b90]")}>
                  {firstName} {lastName}
                </p>
                {!isActive && (
                  <span className="text-xs text-[#8b8b90] font-normal">({tStatus('inactive')})</span>
                )}
              </div>
              <p className={cn("text-sm text-[#8b8b90]", !isActive && "text-[#8b8b90]")}>{phone}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'center',
      header: t('center'),
      className: '!pl-4 !pr-4 !w-[200px] !min-w-[200px] !max-w-[200px]',
      render: (teacher: Teacher) => {
        const centers = getTeacherCenters(teacher);
        const selectedCenterIds = centers.map((center) => center.id);

        return (
          <div onClick={(event) => event.stopPropagation()}>
            <TeacherBranchMultiSelect
              value={selectedCenterIds}
              options={centerOptions}
              onChange={async (centerIds) => {
                await onCenterChange(teacher.id, centerIds);
              }}
              placeholder={t('branchQuickAssign')}
              searchPlaceholder={t('searchPlaceholder')}
              disabled={isUpdating || isDeleting || isLoading}
            />
          </div>
        );
      },
    },
    {
      key: 'groups',
      header: 'Groups',
      sortable: true,
      className: '!pl-4 !pr-4 !w-[170px] !min-w-[170px] !max-w-[170px] text-center',
      render: (teacher: Teacher) => {
        const count = teacher._count?.groups || 0;
        return (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenGroupsModal(teacher, 'groups');
              }}
              className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-blue-700"
              title={t('viewAllGroups')}
            >
              {count}
            </button>
          </div>
        );
      },
    },
    {
      key: 'subGroups',
      header: 'Groups (T2)',
      sortable: false,
      className: '!pl-4 !pr-4 !w-[170px] !min-w-[170px] !max-w-[170px] text-center',
      render: (teacher: Teacher) => {
        const count =
          teacher.secondTeacherForGroupsCount ??
          teacher._count?.secondTeacherForGroups ??
          0;
        return (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenGroupsModal(teacher, 'subgroups');
              }}
              className="inline-flex items-center justify-center rounded-md bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-700"
              title={t('viewSecondRotationGroups')}
            >
              {count}
            </button>
          </div>
        );
      },
    },
    {
      key: 'lessonRate',
      header: 'Per Lesson Rate',
      className: '!pl-4 !pr-4 !w-[170px] !min-w-[170px] !max-w-[170px] text-center',
      render: (teacher: Teacher) => {
        const lessonRate = teacher.lessonRateAMD;
        const fallback =
          typeof teacher.hourlyRate === 'string'
            ? parseFloat(teacher.hourlyRate)
            : Number(teacher.hourlyRate || 0);
        const rate =
          lessonRate !== undefined && lessonRate !== null
            ? Number(lessonRate)
            : fallback;
        return (
          <div className="flex w-full items-center justify-center">
            <span className="text-[#3b3b40] font-medium text-center">
              {formatLessonRate(rate)}
            </span>
          </div>
        );
      },
    },
  ];
}

