'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ActionButtons } from '@/shared/components/ui';
import { SelectAllCheckbox } from '@/shared/components/ui/select-all-checkbox';
import { InlineSelect } from '@/features/students';
import { formatCurrency } from '@/shared/lib/utils';
import { getErrorMessage } from '@/shared/lib/api';
import type { Student } from '@/features/students';

/** Format for display (DD/MM/YYYY) */
function formatRegisterDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Format raw input to DD/MM/YYYY: only digits allowed, slashes auto-inserted and never removed */
function formatDateInput(nextInput: string): string {
  const digits = nextInput.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parse DD/MM/YYYY to YYYY-MM-DD for API, or null if invalid/empty */
function parseDDMMYYYYToISO(str: string): string | null {
  const trimmed = str.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(year)) return null;
  if (month < 0 || month > 11) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function RegisterDateCell({
  studentId,
  value,
  onSave,
  disabled,
}: {
  studentId: string;
  value: string | null | undefined;
  onSave: (studentId: string, date: string | null) => Promise<void>;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState(formatRegisterDate(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(formatRegisterDate(value));
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = async (dateStr: string | null) => {
    setError(null);
    setSaving(true);
    try {
      await onSave(studentId, dateStr);
      setEditing(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update date'));
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleBlur = () => {
    const v = localValue.trim();
    const prevDisplay = formatRegisterDate(value);
    if (v === prevDisplay) {
      setEditing(false);
      return;
    }
    const iso = parseDDMMYYYYToISO(v);
    if (v === '' || iso !== null) {
      handleSave(v === '' ? null : iso);
    } else {
      setError('Use DD/MM/YYYY');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const v = localValue.trim();
      const iso = parseDDMMYYYYToISO(v);
      if (v === '' || iso !== null) {
        handleSave(v === '' ? null : iso);
      } else {
        setError('Use DD/MM/YYYY');
        setTimeout(() => setError(null), 3000);
      }
    }
    if (e.key === 'Escape') {
      setLocalValue(formatRegisterDate(value));
      setEditing(false);
    }
  };

  if (editing && !disabled) {
    return (
      <div className="min-w-[120px]" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          placeholder="DD/MM/YYYY"
          onChange={(e) => setLocalValue(formatDateInput(e.target.value))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        {error && (
          <p className="absolute mt-0.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  const displayText = formatRegisterDate(value) || '—';
  return (
    <div
      className="min-w-[100px] pl-4"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled || saving}
        className={displayText === '—' ? 'text-slate-400 hover:text-slate-600' : 'text-slate-700 hover:text-slate-900'}
        title={displayText === '—' ? 'Set register date' : 'Edit register date'}
      >
        {displayText}
      </button>
    </div>
  );
}

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
  onShowFeedback: (student: Student) => void;
  onTeacherChange: (studentId: string, teacherId: string | null) => Promise<void>;
  onGroupChange: (studentId: string, groupId: string | null) => Promise<void>;
  onCenterChange: (studentId: string, centerId: string | null) => Promise<void>;
  onRegisterDateChange: (studentId: string, date: string | null) => Promise<void>;
  teacherOptions: Array<{ id: string; label: string }>;
  groupOptions: Array<{ id: string; label: string }>;
  centerOptions: Array<{ id: string; label: string }>;
  isDeleting: boolean;
  isUpdating: boolean;
  isLoading: boolean;
}

export function createStudentsTableColumns({
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
  onShowFeedback,
  onTeacherChange,
  onGroupChange,
  onCenterChange,
  onRegisterDateChange,
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
      key: 'register',
      header: 'REGISTER',
      className: 'text-left',
      render: (student: Student) => (
        <RegisterDateCell
          studentId={student.id}
          value={student.registerDate}
          onSave={onRegisterDateChange}
          disabled={isUpdating}
        />
      ),
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
      className: '!w-[180px] !min-w-[180px] !max-w-[180px] !px-3 !py-4 text-left',
      render: (student: Student) => {
        const isActive = student.user?.status === 'ACTIVE';
        const btnClass =
          'p-1.5 text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

        return (
          <div
            className="flex items-center justify-start gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Message"
              title="Message"
              className={btnClass}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onShowFeedback(student);
              }}
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </button>
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

