'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ActionButtons, Avatar } from '@/shared/components/ui';
import { SelectAllCheckbox } from '@/shared/components/ui/select-all-checkbox';
import { InlineSelect } from '@/features/students';
import { cn, formatCurrency, formatPhoneForDisplay } from '@/shared/lib/utils';
import { formatDmyInputValue, parseDmyToIso } from '@/shared/lib/dmy-date';
import { getErrorMessage } from '@/shared/lib/api';
import type { Student, TeacherAssignedItem } from '@/features/students';
import { getItemId, isOnboardingItem } from '@/features/students';
import { teacherBelongsToCenter } from '@/features/students/lib/center-scoped-assignment';
import type { Group } from '@/features/groups';
import type { Teacher } from '@/features/teachers';

const NEW_STUDENT_BADGE_DAYS = 30;

type SelectOption = { id: string; label: string; searchText?: string };

function buildTeacherSearchText(teacher: Teacher): string {
  const firstName = teacher.user.firstName ?? '';
  const lastName = teacher.user.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = teacher.user.email ?? '';
  return [firstName, lastName, fullName, email].filter(Boolean).join(' ');
}

function buildGroupSearchText(group: Group): string {
  return [group.name, group.level, group.center?.name].filter(Boolean).join(' ');
}

function mapTeacherToOption(teacher: Teacher): SelectOption {
  return {
    id: teacher.id,
    label: `${teacher.user.firstName} ${teacher.user.lastName}`.trim(),
    searchText: buildTeacherSearchText(teacher),
  };
}

function mapGroupToOption(group: Group): SelectOption {
  return {
    id: group.id,
    label: `${group.name}${group.level ? ` (${group.level})` : ''}`,
    searchText: buildGroupSearchText(group),
  };
}

function getHorizontalScrollContainer(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null;
  while (current) {
    const style = window.getComputedStyle(current);
    const canScrollX = (style.overflowX === 'auto' || style.overflowX === 'scroll')
      && current.scrollWidth > current.clientWidth;
    if (canScrollX) return current;
    current = current.parentElement;
  }
  return null;
}

function buildTeacherOptionsForRow(
  centerId: string | null,
  currentTeacherId: string | null,
  teachers: Teacher[],
  groups: Group[],
): SelectOption[] {
  if (!centerId) {
    if (!currentTeacherId) return [];
    const t = teachers.find((x) => x.id === currentTeacherId);
    return t ? [mapTeacherToOption(t)] : [];
  }
  const filtered = teachers
    .filter((t) => teacherBelongsToCenter(t.id, centerId, t.centerLinks, groups))
    .map(mapTeacherToOption);
  if (currentTeacherId && !filtered.some((o) => o.id === currentTeacherId)) {
    const t = teachers.find((x) => x.id === currentTeacherId);
    if (t) {
      return [mapTeacherToOption(t), ...filtered];
    }
  }
  return filtered;
}

function buildGroupOptionsForRow(
  centerId: string | null,
  teacherId: string | null,
  currentGroupId: string | null,
  groups: Group[],
): SelectOption[] {
  if (!centerId || !teacherId) {
    if (!currentGroupId) return [];
    const g = groups.find((x) => x.id === currentGroupId);
    return g ? [mapGroupToOption(g)] : [];
  }
  const filtered = groups
    .filter((g) => g.teacherId === teacherId && g.centerId === centerId)
    .map(mapGroupToOption);
  if (currentGroupId && !filtered.some((o) => o.id === currentGroupId)) {
    const g = groups.find((x) => x.id === currentGroupId);
    if (g) {
      return [mapGroupToOption(g), ...filtered];
    }
  }
  return filtered;
}

function getRiskBadge(
  derivedRisk: Student['derivedRiskLabel'] | undefined,
): { label: string; className: string } | null {
  if (derivedRisk === 'HIGH_RISK') {
    return {
      label: 'High Risk',
      className: 'bg-rose-900 text-rose-50 border-rose-900/90',
    };
  }
  if (derivedRisk === 'RISK') {
    return {
      label: 'Risk',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }
  return null;
}

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

/** Parse DD/MM/YYYY to YYYY-MM-DD for API, or null if invalid/empty */
function parseDDMMYYYYToISO(str: string): string | null {
  return parseDmyToIso(str.trim()) ?? null;
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
      const scrollContainer = getHorizontalScrollContainer(inputRef.current);
      const previousScrollLeft = scrollContainer?.scrollLeft ?? 0;
      try {
        inputRef.current.focus({ preventScroll: true });
      } catch {
        inputRef.current.focus();
      }
      if (scrollContainer) {
        scrollContainer.scrollLeft = previousScrollLeft;
      }
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
      setLocalValue(prevDisplay);
      setEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const v = localValue.trim();
      const iso = parseDDMMYYYYToISO(v);
      if (v === '' || iso !== null) {
        handleSave(v === '' ? null : iso);
      } else {
        setLocalValue(formatRegisterDate(value));
        setEditing(false);
      }
    }
    if (e.key === 'Escape') {
      setLocalValue(formatRegisterDate(value));
      setEditing(false);
    }
  };

  if (editing && !disabled) {
    return (
      <div className="relative min-w-0 w-full min-h-8" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          placeholder="DD/MM/YYYY"
          onChange={(e) => setLocalValue(formatDmyInputValue(e.target.value, localValue))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="h-8 w-full rounded border border-[rgba(14,14,16,0.12)] px-2 py-1 text-sm focus:border-[#1010a3] focus:outline-none focus:ring-1 focus:ring-[#1010a3] disabled:opacity-50"
        />
        {error && (
          <p className="absolute left-0 top-full mt-0.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  const displayText = formatRegisterDate(value) || '—';
  return (
    <div
      className="relative flex min-h-8 min-w-0 items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled || saving}
        className={cn(
          'h-8 whitespace-nowrap rounded px-1 text-left text-sm transition-colors',
          displayText === '—'
            ? 'text-[#8b8b90] hover:text-[#3b3b40]'
            : 'text-[#3b3b40] hover:text-[#1010a3]',
        )}
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
  teachers: Teacher[];
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
  teachers,
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
            className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            checked={selectedStudentIds.has(getItemId(row))}
            onChange={() => onToggleSelect(getItemId(row))}
            onClick={(e) => e.stopPropagation()}
            disabled={isDeleting || isLoading}
            aria-label={`Select ${name || 'item'}`}
          />
        );
      },
      className: '!w-9 !min-w-9 shrink-0 !pl-2 !pr-1',
    },
    {
      key: 'student',
      header: 'STUDENT',
      sortable: true,
      className: '!w-[18%] !min-w-[12rem] !pl-0 !pr-2 align-top',
      render: (row: TeacherAssignedItem) => {
        const firstName = isOnboardingItem(row) ? (row.firstName ?? '') : (row.user?.firstName ?? '');
        const lastName = isOnboardingItem(row) ? (row.lastName ?? '') : (row.user?.lastName ?? '');
        const phoneRaw = isOnboardingItem(row) ? row.phone : row.user?.phone;
        const phone = formatPhoneForDisplay(phoneRaw, 'No phone');
        const fullName = `${firstName} ${lastName}`.trim() || '?';
        const avatarUrl = isOnboardingItem(row) ? undefined : row.user?.avatarUrl;
        // Lifecycle/risk badges – computed from persisted status + server-derived risk.
        const derivedRisk =
          !isOnboardingItem(row) ? (row.derivedRiskLabel ?? row.riskLabel) : undefined;
        const showNewBadge = !isOnboardingItem(row) ? isNewPaidStudent(row) : false;
        const riskBadge = getRiskBadge(derivedRisk);
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
              <p className="font-semibold text-[#3b3b40] leading-tight break-words">
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
                <span className="text-sm text-[#8b8b90]">{phone}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'center',
      header: 'CENTER',
      className: '!w-[13%] !min-w-[8.75rem] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
        // Center column = manual `student.centerId` only; never mirror group.center (avoids "auto-select" when group changes).
        const manualCenterId = row.centerId ?? null;
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              value={manualCenterId}
              options={centerOptions}
              onChange={async (centerId) => {
                await onCenterChange(row.id, centerId);
              }}
              placeholder="Not assigned"
              clearLabel="Not assigned"
              disabled={isUpdating}
            />
          </div>
        );
      },
    },
    {
      key: 'teacher',
      header: 'TEACHER',
      className: '!w-[13%] !min-w-[8.75rem] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
        const manualCenterId = row.centerId ?? null;
        const teacherOptionsForRow = buildTeacherOptionsForRow(
          manualCenterId,
          row.teacherId || null,
          teachers,
          groups,
        );
        const teacherPlaceholder = !manualCenterId ? 'Select a center first' : 'Select teacher';
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              value={row.teacherId || null}
              options={teacherOptionsForRow}
              onChange={async (teacherId) => {
                await onTeacherChange(row.id, teacherId);
              }}
              placeholder={teacherPlaceholder}
              clearLabel="Not assigned"
              disabled={isUpdating || !manualCenterId}
              searchable
              searchPlaceholder="Search teacher..."
              emptySearchMessage="No teachers found"
            />
          </div>
        );
      },
    },
    {
      key: 'group',
      header: 'GROUP',
      className: '!w-[13%] !min-w-[8.75rem] align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
        const manualCenterId = row.centerId ?? null;
        const teacherId = row.teacherId || null;
        const groupOptionsForRow = buildGroupOptionsForRow(
          manualCenterId,
          teacherId,
          row.groupId || null,
          groups,
        );
        const groupPlaceholder = !teacherId ? 'Select a teacher first' : 'Select group';
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              value={row.groupId || null}
              options={groupOptionsForRow}
              onChange={async (groupId) => {
                await onGroupChange(row.id, groupId);
              }}
              placeholder={groupPlaceholder}
              clearLabel="Not assigned"
              disabled={isUpdating || !teacherId}
              searchable
              searchPlaceholder="Search group..."
              emptySearchMessage="No groups found"
            />
          </div>
        );
      },
    },
    {
      key: 'register',
      header: 'REGISTER',
      sortable: true,
      className: '!w-[10%] !min-w-[8.25rem] whitespace-nowrap text-left align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
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
      className: '!w-[11%] !min-w-[6.5rem] whitespace-nowrap text-center align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
        const fee = typeof row.monthlyFee === 'string' ? parseFloat(row.monthlyFee) : Number(row.monthlyFee || 0);
        return (
          <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-[#3b3b40] font-medium whitespace-nowrap">{formatCurrency(fee)}</span>
          </div>
        );
      },
    },
    {
      key: 'absence',
      header: 'ABSENCE',
      sortable: true,
      className: '!w-[8%] !min-w-[5rem] whitespace-nowrap text-center align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) {
          return (
            <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
              <span className="text-[#8b8b90]">—</span>
            </div>
          );
        }
        const absencesThisMonth = row.attendanceSummary?.absences ?? 0;
        return (
          <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
            <span className="text-[#3b3b40] font-medium">{absencesThisMonth}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: '!w-[11%] !min-w-[9.5rem] shrink-0 !px-2 !py-3 text-center align-top',
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) {
          return (
            <span className="text-[#8b8b90] text-xs" onClick={(e) => e.stopPropagation()}>Onboarding</span>
          );
        }
        const student = row;
        const isActive = student.user?.status === 'ACTIVE';
        const btnClass =
          'p-1.5 text-[#1010a3] hover:text-[#3b3b40] hover:bg-[#fafafa] rounded-lg transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

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

