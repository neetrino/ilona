'use client';

import { Avatar, Badge } from '@/shared/components/ui';
import { ActionButtons } from '@/shared/components/ui';
import { SelectAllCheckbox } from './SelectAllCheckbox';
import { cn } from '@/shared/lib/utils';
import type { Teacher } from '@/features/teachers';
import { getTeacherCenters, formatHourlyRate } from '../utils';
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
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
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
  onEdit,
  onDelete,
  onDeactivate,
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
      className: '!pl-4 !pr-4 !min-w-[280px]',
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
      className: '!pl-4 !pr-4 !min-w-[180px]',
      render: (teacher: Teacher) => {
        const centers = getTeacherCenters(teacher);
        
        return (
          <div className="flex flex-wrap gap-1.5">
            {centers.length > 0 ? (
              <>
                {centers.slice(0, 2).map((center) => (
                  <Badge key={center.id} variant="default">
                    {center.name}
                  </Badge>
                ))}
                {centers.length > 2 && (
                  <div title={centers.slice(2).map(c => c.name).join(', ')}>
                    <Badge variant="default">
                      +{centers.length - 2}
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <span className="text-slate-400 text-sm">{t('noBranches')}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'groups',
      header: 'Groups',
      sortable: true,
      className: '!pl-4 !pr-4 !min-w-[110px] text-center',
      render: (teacher: Teacher) => {
        const count = teacher._count?.groups || 0;
        return (
          <div className="flex justify-center">
            <span
              className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-blue-700"
              title="Click row to view groups"
            >
              {count}
            </span>
          </div>
        );
      },
    },
    {
      key: 'subGroups',
      header: 'Sub-groups',
      sortable: false,
      className: '!pl-4 !pr-4 !min-w-[120px] text-center',
      render: (teacher: Teacher) => {
        const count =
          teacher.substituteForGroupsCount ??
          teacher._count?.substituteForGroups ??
          0;
        return (
          <div className="flex justify-center">
            <span
              className="inline-flex items-center justify-center rounded-md bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-700"
              title="Click row to view substitute groups"
            >
              {count}
            </span>
          </div>
        );
      },
    },
    {
      key: 'lessonRate',
      header: 'Per Lesson Rate',
      className: '!pl-4 !pr-4 !min-w-[150px]',
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
          <span className="text-slate-700 font-medium">
            {formatHourlyRate(rate)}/lesson
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: t('actions'),
      className: '!pl-4 !pr-7 !w-[140px] !min-w-[140px] !max-w-[140px]',
      render: (teacher: Teacher) => {
        const isActive = teacher.user?.status === 'ACTIVE';
        
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionButtons
              onEdit={() => onEdit(teacher)}
              onDisable={() => onDeactivate(teacher)}
              onDelete={() => onDelete(teacher)}
              isActive={isActive}
              disabled={isUpdating || isDeleting}
              ariaLabels={{
                edit: tCommon('edit'),
                disable: isActive ? t('deactivate') : t('activate'),
                delete: tCommon('delete'),
              }}
              titles={{
                edit: tCommon('edit'),
                disable: isActive ? t('deactivate') : t('activate'),
                delete: tCommon('delete'),
              }}
            />
          </div>
        );
      },
    },
  ];
}

