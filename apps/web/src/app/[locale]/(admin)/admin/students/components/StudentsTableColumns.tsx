'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ActionButtons, Avatar } from '@/shared/components/ui';
import { SelectAllCheckbox } from '@/shared/components/ui/select-all-checkbox';
import { InlineSelect } from '@/features/students';
import { formatCurrency } from '@/shared/lib/utils';
import { getErrorMessage } from '@/shared/lib/api';
import type { Student, TeacherAssignedItem } from '@/features/students';
import { getItemId, isOnboardingItem } from '@/features/students';
import type { Group } from '@/features/groups';

const NEW_STUDENT_BADGE_DAYS = 30;

function isNewPaidStudent(student: Student): boolean {
  if (student.isRecentlyPaidFromCrm !== undefined) {
    return student.isRecentlyPaidFromCrm;
  }

  if (!student.leadId) {
    return false;
  }

  const activationDateRaw = student.enrolledAt ?? student.createdAt;
  if (!activationDateRaw) {
    return false;
  }

  const activationDate = new Date(activationDateRaw);
  if (Number.isNaN(activationDate.getTime())) {
    return false;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NEW_STUDENT_BADGE_DAYS);
  return activationDate >= cutoff;
}

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
      <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
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
      className="min-w-0"
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
  groups: Group[];
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
  groups,
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
      render: (row: TeacherAssignedItem) => {
        const name = isOnboardingItem(row) ? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() : `${row.user?.firstName ?? ''} ${row.user?.lastName ?? ''}`.trim();
        return (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            checked={selectedStudentIds.has(getItemId(row))}
            onChange={() => onToggleSelect(getItemId(row))}
            onClick={(e) => e.stopPropagation()}
            disabled={isDeleting || isLoading}
            aria-label={`Select ${name || 'item'}`}
          />
        );
      },
      className: '!pl-2 !pr-1 !w-[36px] !min-w-[36px]',
    },
    {
      key: 'student',
      header: 'STUDENT',
      sortable: true,
      className: '!pl-0 !pr-2 !w-[21%] align-top',
      render: (row: TeacherAssignedItem) => {
        const firstName = isOnboardingItem(row) ? (row.firstName ?? '') : (row.user?.firstName ?? '');
        const lastName = isOnboardingItem(row) ? (row.lastName ?? '') : (row.user?.lastName ?? '');
        const phone = isOnboardingItem(row) ? (row.phone ?? 'No phone') : (row.user?.phone ?? 'No phone');
        const fullName = `${firstName} ${lastName}`.trim() || '?';
        const avatarUrl = isOnboardingItem(row) ? undefined : row.user?.avatarUrl;
        // Lifecycle/risk badges – computed from persisted status + server-derived risk.
        const derivedRisk =
          !isOnboardingItem(row) ? (row.derivedRiskLabel ?? row.riskLabel) : undefined;
        const showNewBadge = !isOnboardingItem(row) ? isNewPaidStudent(row) : false;
        const riskBadge =
          derivedRisk === 'HIGH_RISK'
            ? { label: 'High risk', className: 'bg-red-100 text-red-700 border-red-200' }
            : derivedRisk === 'RISK'
              ? { label: 'Risk', className: 'bg-amber-100 text-amber-700 border-amber-200' }
              : null;
        return (
          <div className="flex items-start gap-2">
            <div className="relative shrink-0">
              <Avatar src={avatarUrl} name={fullName} size="md" />
              {showNewBadge && (
                <span className="absolute -left-3 top-[14%] -translate-y-1/2 -rotate-12 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-[0.08em] bg-emerald-500 text-white shadow-sm pointer-events-none">
                  NEW
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 leading-tight break-words">
                {firstName} {lastName}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {riskBadge && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${riskBadge.className}`}
                  >
                    {riskBadge.label}
                  </span>
                )}
                <span className="text-sm text-slate-500">{phone}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'teacher',
      header: 'TEACHER',
      className: '!w-[14%] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-slate-400">—</span>;
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              value={row.teacherId || null}
              options={teacherOptions}
              onChange={async (teacherId) => {
                await onTeacherChange(row.id, teacherId);
              }}
              placeholder="Not assigned"
              disabled={isUpdating}
            />
          </div>
        );
      },
    },
    {
      key: 'group',
      header: 'GROUP',
      className: '!w-[14%] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-slate-400">—</span>;
        const teacherId = row.teacherId || null;
        const groupOptionsForTeacher = teacherId
          ? groups
              .filter((g) => g.teacherId === teacherId)
              .map((g) => ({ id: g.id, label: `${g.name}${g.level ? ` (${g.level})` : ''}` }))
          : [];
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              value={row.groupId || null}
              options={groupOptionsForTeacher}
              onChange={async (groupId) => {
                await onGroupChange(row.id, groupId);
              }}
              placeholder={!teacherId ? 'Select Teacher first' : 'Not assigned'}
              disabled={isUpdating || !teacherId}
            />
          </div>
        );
      },
    },
    {
      key: 'center',
      header: 'CENTER',
      className: '!w-[14%] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-slate-400">—</span>;
        const currentCenterId = row.group?.center?.id || null;
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              value={currentCenterId}
              options={centerOptions}
              onChange={async (centerId) => {
                await onCenterChange(row.id, centerId);
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
      sortable: true,
      className: 'text-left !w-[11%] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-slate-400">—</span>;
        return (
          <RegisterDateCell
            studentId={row.id}
            value={row.registerDate}
            onSave={onRegisterDateChange}
            disabled={isUpdating}
          />
        );
      },
    },
    {
      key: 'monthlyFee',
      header: 'MONTHLY FEE',
      sortable: true,
      className: 'text-center !w-[10%] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-slate-400">—</span>;
        const fee = typeof row.monthlyFee === 'string' ? parseFloat(row.monthlyFee) : Number(row.monthlyFee || 0);
        return (
          <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-slate-700 font-medium whitespace-nowrap">{formatCurrency(fee)}</span>
          </div>
        );
      },
    },
    {
      key: 'absence',
      header: 'ABSENCE',
      sortable: true,
      className: 'text-center !w-[7%] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) {
          return (
            <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
              <span className="text-slate-400">—</span>
            </div>
          );
        }
        const attendance = row.attendanceSummary;
        if (!row.groupId) {
          return (
            <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
              <span className="text-slate-400">—</span>
            </div>
          );
        }
        if (!attendance) {
          return (
            <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
              <span className="text-slate-600">0</span>
            </div>
          );
        }
        const { absences } = attendance;
        return (
          <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-slate-700 font-medium">{absences}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: '!w-[160px] !min-w-[160px] !max-w-[160px] !px-2 !py-3 text-center align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) {
          return (
            <span className="text-slate-400 text-xs" onClick={(e) => e.stopPropagation()}>Onboarding</span>
          );
        }
        const student = row;
        const isActive = student.user?.status === 'ACTIVE';
        const btnClass =
          'p-1.5 text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

        return (
          <div
            className="w-full flex items-center justify-center gap-0.5"
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

