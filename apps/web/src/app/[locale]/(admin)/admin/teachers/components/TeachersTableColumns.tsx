'use client';

import { Badge } from '@/shared/components/ui';
import { ActionButtons } from '@/shared/components/ui';
import { SelectAllCheckbox } from './SelectAllCheckbox';
import { cn } from '@/shared/lib/utils';
import type { Teacher } from '@/features/teachers';
import { getTeacherCenters, formatHourlyRate } from '../utils';

interface TeachersTableColumnsProps {
  t: (key: string) => string;
  tCommon: (key: string) => string;
  tStatus: (key: string) => string;
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
        const phone = teacher.user?.phone || t('noPhoneNumber');
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        const isActive = teacher.user?.status === 'ACTIVE';
        return (
          <div className={cn("flex items-center gap-3", !isActive && "opacity-60")} onClick={(e) => e.stopPropagation()}>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-slate-600 font-semibold flex-shrink-0", isActive ? "bg-slate-200" : "bg-slate-100")}>
              {initials}
            </div>
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
          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
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
      key: 'students',
      header: t('students'),
      sortable: true,
      className: '!pl-4 !pr-4 !min-w-[100px] text-center',
      render: (teacher: Teacher) => {
        const studentCount = teacher._count?.students || 0;
        return (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-slate-700 font-medium">
              {studentCount}
            </span>
          </div>
        );
      },
    },
    {
      key: 'hourlyRate',
      header: t('rate'),
      className: '!pl-4 !pr-4 !min-w-[140px]',
      render: (teacher: Teacher) => {
        const rate = typeof teacher.hourlyRate === 'string' ? parseFloat(teacher.hourlyRate) : Number(teacher.hourlyRate || 0);
        return (
          <span className="text-slate-700 font-medium" onClick={(e) => e.stopPropagation()}>
            {formatHourlyRate(rate)}/hr
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

