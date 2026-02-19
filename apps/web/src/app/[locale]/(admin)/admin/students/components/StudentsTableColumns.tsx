'use client';

import { ActionButtons } from '@/shared/components/ui';
import { SelectAllCheckbox } from '@/shared/components/ui/select-all-checkbox';
import { InlineSelect } from '@/features/students';
import { formatCurrency } from '@/shared/lib/utils';
import type { Student } from '@/features/students';

interface StudentsTableColumnsProps {
  t: (key: string) => string;
  tCommon: (key: string) => string;
  tTeachers: (key: string) => string;
  allSelected: boolean;
  someSelected: boolean;
  selectedStudentIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (studentId: string) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onDeactivate: (student: Student) => void;
  onTeacherChange: (studentId: string, teacherId: string | null) => Promise<void>;
  onGroupChange: (studentId: string, groupId: string | null) => Promise<void>;
  onCenterChange: (studentId: string, centerId: string | null) => Promise<void>;
  teacherOptions: Array<{ id: string; label: string }>;
  groupOptions: Array<{ id: string; label: string }>;
  centerOptions: Array<{ id: string; label: string }>;
  isDeleting: boolean;
  isUpdating: boolean;
  isLoading: boolean;
}

export function createStudentsTableColumns({
  t,
  tCommon,
  tTeachers,
  allSelected,
  someSelected,
  selectedStudentIds,
  onSelectAll,
  onToggleSelect,
  onEdit,
  onDelete,
  onDeactivate,
  onTeacherChange,
  onGroupChange,
  onCenterChange,
  teacherOptions,
  groupOptions,
  centerOptions,
  isDeleting,
  isUpdating,
  isLoading,
}: StudentsTableColumnsProps) {
  return [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={onSelectAll}
          disabled={isDeleting || isLoading}
        />
      ),
      render: (student: Student) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          checked={selectedStudentIds.has(student.id)}
          onChange={() => onToggleSelect(student.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={isDeleting || isLoading}
          aria-label={`Select ${student.user?.firstName} ${student.user?.lastName}`}
        />
      ),
      className: '!pl-4 !pr-2 w-12',
    },
    {
      key: 'student',
      header: 'STUDENT',
      sortable: true,
      className: '!pl-0 !pr-4',
      render: (student: Student) => {
        const firstName = student.user?.firstName || '';
        const lastName = student.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-slate-500">
                {student.user?.phone || 'No phone'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'teacher',
      header: 'TEACHER',
      render: (student: Student) => (
        <div className="min-w-[150px]" onClick={(e) => e.stopPropagation()}>
          <InlineSelect
            value={student.teacherId || null}
            options={teacherOptions}
            onChange={async (teacherId) => {
              await onTeacherChange(student.id, teacherId);
            }}
            placeholder="Not assigned"
            disabled={isUpdating}
          />
        </div>
      ),
    },
    {
      key: 'group',
      header: 'GROUP',
      render: (student: Student) => (
        <div className="min-w-[150px]" onClick={(e) => e.stopPropagation()}>
          <InlineSelect
            value={student.groupId || null}
            options={groupOptions}
            onChange={async (groupId) => {
              await onGroupChange(student.id, groupId);
            }}
            placeholder="Not assigned"
            disabled={isUpdating}
          />
        </div>
      ),
    },
    {
      key: 'center',
      header: 'CENTER',
      render: (student: Student) => {
        const currentCenterId = student.group?.center?.id || null;
        return (
          <div className="min-w-[150px]" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              value={currentCenterId}
              options={centerOptions}
              onChange={async (centerId) => {
                await onCenterChange(student.id, centerId);
              }}
              placeholder="Not assigned"
              disabled={isUpdating}
            />
          </div>
        );
      },
    },
    {
      key: 'monthlyFee',
      header: 'MONTHLY FEE',
      sortable: true,
      className: 'text-left',
      render: (student: Student) => {
        const fee = typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) : Number(student.monthlyFee || 0);
        return (
          <span className="text-slate-700 font-medium" onClick={(e) => e.stopPropagation()}>
            {formatCurrency(fee)}
          </span>
        );
      },
    },
    {
      key: 'absence',
      header: 'ABSENCE',
      sortable: true,
      className: 'text-left',
      render: (student: Student) => {
        const attendance = student.attendanceSummary;
        
        // If student has no group, show "—"
        if (!student.groupId) {
          return (
            <span className="text-slate-400 pl-4" onClick={(e) => e.stopPropagation()}>—</span>
          );
        }
        
        // If no attendance data, show "0/0"
        if (!attendance) {
          return (
            <span className="text-slate-600 pl-4" onClick={(e) => e.stopPropagation()}>0/0</span>
          );
        }
        
        const { totalClasses, absences } = attendance;
        return (
          <span className="text-slate-700 font-medium pl-4" onClick={(e) => e.stopPropagation()}>
            {totalClasses}/{absences}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: '!w-[160px] !min-w-[160px] !max-w-[160px] !px-3 !py-4 text-left',
      render: (student: Student) => {
        const isActive = student.user?.status === 'ACTIVE';
        
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionButtons
              onEdit={() => onEdit(student)}
              onDisable={() => onDeactivate(student)}
              onDelete={() => onDelete(student)}
              isActive={isActive}
              disabled={isUpdating || isDeleting}
              ariaLabels={{
                edit: tCommon('edit'),
                disable: isActive ? tTeachers('deactivate') : tTeachers('activate'),
                delete: tCommon('delete'),
              }}
              titles={{
                edit: tCommon('edit'),
                disable: isActive ? tTeachers('deactivate') : tTeachers('activate'),
                delete: tCommon('delete'),
              }}
            />
          </div>
        );
      },
    },
  ];
}

