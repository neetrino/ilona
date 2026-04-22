'use client';

import { Avatar } from '@/shared/components/ui';
import { ActionButtons } from '@/shared/components/ui';
import { InlineSelect } from '@/features/students';
import { SelectAllCheckbox } from './SelectAllCheckbox';
import { cn } from '@/shared/lib/utils';
import type { Teacher } from '@/features/teachers';
import { getTeacherCenters, formatLessonRate } from '../utils';
import type { useTranslations } from 'next-intl';

interface TeachersTableColumnsProps {
  t: ReturnType<typeof useTranslations<'teachers'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
  tStatus: ReturnType<typeof useTranslations<'status'>>;
  allSelected: boolean;
  someSelected: boolean;
  selectedTeacherIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (teacherId: string) => void;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
  onCenterChange: (teacherId: string, centerId: string | null) => Promise<void>;
  onOpenGroupsModal: (teacher: Teacher, tab: 'groups' | 'subgroups') => void;
  centerOptions: Array<{ id: string; label: string }>;
  isDeleting: boolean;
  isUpdating: boolean;
  isLoading: boolean;
}

export function createTeachersTableColumns({
  t,
  tCommon,
  tStatus,
  allSelected,
  someSelected,
  selectedTeacherIds,
  onSelectAll,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onDeactivate,
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
          className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        const phone = teacher.user?.phone || t('noPhoneNumber');
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
                <p className={cn("font-semibold text-slate-800", !isActive && "text-slate-500")}>
                  {firstName} {lastName}
                </p>
                {!isActive && (
                  <span className="text-xs text-slate-400 font-normal">({tStatus('inactive')})</span>
                )}
              </div>
              <p className={cn("text-sm text-slate-500", !isActive && "text-slate-400")}>{phone}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'center',
      header: t('center'),
      className: '!pl-4 !pr-4 !w-[170px] !min-w-[170px] !max-w-[170px]',
      render: (teacher: Teacher) => {
        const centers = getTeacherCenters(teacher);
        const currentCenterId = centers[0]?.id || null;

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="min-w-[150px]" onClick={(event) => event.stopPropagation()}>
              <InlineSelect
                value={currentCenterId}
                options={centerOptions}
                onChange={async (centerId) => {
                  await onCenterChange(teacher.id, centerId);
                }}
                placeholder={t('noBranches')}
                disabled={isUpdating || isDeleting || isLoading}
              />
            </div>
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
              title="View all groups"
            >
              {count}
            </button>
          </div>
        );
      },
    },
    {
      key: 'subGroups',
      header: 'Sub-groups',
      sortable: false,
      className: '!pl-4 !pr-4 !w-[170px] !min-w-[170px] !max-w-[170px] text-center',
      render: (teacher: Teacher) => {
        const count =
          teacher.substituteForGroupsCount ??
          teacher._count?.substituteForGroups ??
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
              title="View all substitute groups"
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
            <span className="text-slate-700 font-medium text-center">
              {formatLessonRate(rate)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: t('actions'),
      className: '!pl-4 !pr-4 !w-[170px] !min-w-[170px] !max-w-[170px]',
      render: (teacher: Teacher) => {
        const isActive = teacher.user?.status === 'ACTIVE';
        
        return (
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <ActionButtons
              onView={() => onView(teacher)}
              onEdit={() => onEdit(teacher)}
              onDisable={() => onDeactivate(teacher)}
              onDelete={() => onDelete(teacher)}
              isActive={isActive}
              disabled={isUpdating || isDeleting}
              ariaLabels={{
                view: 'View teacher details',
                edit: tCommon('edit'),
                disable: isActive ? t('deactivate') : t('activate'),
                delete: tCommon('delete'),
              }}
              titles={{
                view: 'View teacher details',
                edit: tCommon('edit'),
                disable: isActive ? t('deactivate') : t('activate'),
                delete: tCommon('delete'),
              }}
              className="whitespace-nowrap"
            />
          </div>
        );
      },
    },
  ];
}

