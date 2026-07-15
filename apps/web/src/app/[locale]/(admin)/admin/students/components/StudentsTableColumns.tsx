'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ActionButtons, Avatar } from '@/shared/components/ui';
import { SelectAllCheckbox } from '@/shared/components/ui/select-all-checkbox';
import { InlineSelect } from '@/features/students';
import { cn, formatCurrency, formatPhoneForDisplay } from '@/shared/lib/utils';
import { applyDmyInputChange, parseDmyToIso } from '@/shared/lib/dmy-date';
import { getErrorMessage } from '@/shared/lib/api';
import type { Student, TeacherAssignedItem } from '@/features/students';
import { getItemId, isOnboardingItem } from '@/features/students';
import {
  ensureCurrentGroupInList,
  filterAssignableGroupsByCenter,
  type GroupAssignmentOption,
} from '@/features/students/lib/group-center-assignment';
import type { Group } from '@/features/groups';
import { useTranslations } from 'next-intl';

const NEW_STUDENT_BADGE_DAYS = 30;

/** Equal header rhythm: same horizontal padding + equal share after the checkbox column. */
const HEADER_CELL_X = '!px-4';
const DATA_COL_SHARE_MOBILE = '!w-[calc((100%-2.5rem)/7)]';
const DATA_COL_SHARE_DESKTOP = 'sheet:!w-[calc((100%-2.5rem)/6)]';
const DATA_COL_SHARE = `${DATA_COL_SHARE_MOBILE} ${DATA_COL_SHARE_DESKTOP}`;

const COL = {
  checkbox: `!w-10 !min-w-10 !max-w-10 shrink-0 ${HEADER_CELL_X} align-middle`,
  student: `${DATA_COL_SHARE} !min-w-[10rem] ${HEADER_CELL_X} align-middle`,
  center: `${DATA_COL_SHARE} !min-w-[9rem] ${HEADER_CELL_X} align-middle`,
  group: `${DATA_COL_SHARE} !min-w-[9rem] ${HEADER_CELL_X} align-middle`,
  register: `${DATA_COL_SHARE} !min-w-[5.75rem] ${HEADER_CELL_X} align-middle text-center`,
  monthlyFee: `${DATA_COL_SHARE} !min-w-[6.25rem] ${HEADER_CELL_X} align-middle text-center`,
  absence: `${DATA_COL_SHARE} !min-w-[4.5rem] ${HEADER_CELL_X} align-middle text-center`,
  actions: `${DATA_COL_SHARE_MOBILE} !min-w-[7.5rem] shrink-0 ${HEADER_CELL_X} align-middle text-center sheet:!hidden`,
} as const;

const INLINE_SELECT_TABLE_CLASS =
  '[&_button]:min-h-9 [&_button]:py-1.5 [&_button]:text-[13px] [&_button]:leading-snug';

type SelectOption = { id: string; label: string; searchText?: string };

function buildGroupSearchText(group: GroupAssignmentOption): string {
  return [group.name, group.level, group.center?.name].filter(Boolean).join(' ');
}

function mapGroupToOption(group: GroupAssignmentOption): SelectOption {
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

function buildGroupOptionsForRow(
  centerId: string | null,
  currentGroupId: string | null,
  groups: GroupAssignmentOption[],
): SelectOption[] {
  const scoped = filterAssignableGroupsByCenter(groups, centerId ?? undefined);
  const withCurrent = ensureCurrentGroupInList(
    scoped,
    currentGroupId ?? undefined,
    groups,
  );
  return withCurrent.map(mapGroupToOption);
}

function getRiskBadge(
  derivedRisk: Student['derivedRiskLabel'] | undefined,
  labels: { highRisk: string; risk: string },
): { label: string; className: string } | null {
  if (derivedRisk === 'HIGH_RISK') {
    return {
      label: labels.highRisk,
      className: 'bg-rose-900 text-rose-50 border-rose-900/90',
    };
  }
  if (derivedRisk === 'RISK') {
    return {
      label: labels.risk,
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
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
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
          placeholder={tCommon('dateFormatPlaceholder')}
          onChange={(e) => {
            const { value: next, caret } = applyDmyInputChange(
              e.target.value,
              localValue,
              e.target.selectionStart,
            );
            setLocalValue(next);
            requestAnimationFrame(() => {
              e.target.setSelectionRange(caret, caret);
            });
          }}
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
      className="relative flex min-h-9 min-w-0 items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled || saving}
        className={cn(
          'h-9 whitespace-nowrap rounded px-1.5 text-sm transition-colors',
          displayText === '—'
            ? 'text-[#8b8b90] hover:text-[#3b3b40]'
            : 'text-[#3b3b40] hover:text-[#1010a3]',
        )}
        title={displayText === '—' ? t('setRegisterDate') : t('editRegisterDate')}
      >
        {displayText}
      </button>
    </div>
  );
}

interface StudentsTableColumnsProps {
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
  tTeachers: (key: string) => string;
  tAnalytics: (key: string) => string;
  allSelected: boolean;
  someSelected: boolean;
  selectedStudentIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (studentId: string) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onDeactivate: (student: Student) => void;
  onShowFeedback: (student: Student) => void;
  onGroupChange: (studentId: string, groupId: string | null) => Promise<void>;
  onCenterChange: (studentId: string, centerId: string | null) => Promise<void>;
  onRegisterDateChange: (studentId: string, date: string | null) => Promise<void>;
  groups: Group[];
  centerOptions: Array<{ id: string; label: string }>;
  isDeleting: boolean;
  isUpdating: boolean;
  isLoading: boolean;
}

export function createStudentsTableColumns({
  t,
  tCommon,
  tTeachers,
  tAnalytics,
  allSelected,
  someSelected,
  selectedStudentIds,
  onSelectAll,
  onToggleSelect,
  onEdit,
  onDelete,
  onDeactivate,
  onShowFeedback,
  onGroupChange,
  onCenterChange,
  onRegisterDateChange,
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
            aria-label={t('selectItem', { name: name || tCommon('onboarding') })}
          />
        );
      },
      className: COL.checkbox,
    },
    {
      key: 'student',
      header: tCommon('name').toUpperCase(),
      sortable: true,
      className: COL.student,
      render: (row: TeacherAssignedItem) => {
        const firstName = isOnboardingItem(row) ? (row.firstName ?? '') : (row.user?.firstName ?? '');
        const lastName = isOnboardingItem(row) ? (row.lastName ?? '') : (row.user?.lastName ?? '');
        const phoneRaw = isOnboardingItem(row) ? row.phone : row.user?.phone;
        const phone = formatPhoneForDisplay(phoneRaw, t('noPhone'));
        const fullName = `${firstName} ${lastName}`.trim() || '?';
        const avatarUrl = isOnboardingItem(row) ? undefined : row.user?.avatarUrl;
        // Lifecycle/risk badges – computed from persisted status + server-derived risk.
        const derivedRisk =
          !isOnboardingItem(row) ? (row.derivedRiskLabel ?? row.riskLabel) : undefined;
        const showNewBadge = !isOnboardingItem(row) ? isNewPaidStudent(row) : false;
        const riskBadge = getRiskBadge(derivedRisk, {
          highRisk: tAnalytics('highRisk'),
          risk: tAnalytics('riskBadge'),
        });
        return (
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <Avatar src={avatarUrl} name={fullName} size="md" />
              {showNewBadge && (
                <span className="absolute -left-3 top-[14%] -translate-y-1/2 -rotate-12 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-[0.08em] bg-emerald-500 text-white shadow-sm pointer-events-none">
                  {t('newBadge').toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#3b3b40] text-sm leading-snug">
                {firstName} {lastName}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {riskBadge && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${riskBadge.className}`}
                  >
                    {riskBadge.label}
                  </span>
                )}
                <span className="truncate text-xs text-[#8b8b90]">{phone}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'center',
      header: tCommon('center').toUpperCase(),
      className: COL.center,
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
        // Center column = manual `student.centerId` only; never mirror group.center (avoids "auto-select" when group changes).
        const manualCenterId = row.centerId ?? null;
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              className={INLINE_SELECT_TABLE_CLASS}
              value={manualCenterId}
              options={centerOptions}
              onChange={async (centerId) => {
                await onCenterChange(row.id, centerId);
              }}
              placeholder={tCommon('notAssigned')}
              clearLabel={tCommon('notAssigned')}
              disabled={isUpdating}
              searchable
              searchPlaceholder="Search center..."
              emptySearchMessage="No centers found"
            />
          </div>
        );
      },
    },
    {
      key: 'group',
      header: t('group').toUpperCase(),
      className: COL.group,
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
        const manualCenterId = row.centerId ?? null;
        const groupOptionsForRow = buildGroupOptionsForRow(
          manualCenterId,
          row.groupId || null,
          groups,
        );
        const groupPlaceholder = !manualCenterId ? t('form.selectCenterFirst') : t('selectGroup');
        return (
          <div className="min-w-0 w-full" onClick={(e) => e.stopPropagation()}>
            <InlineSelect
              className={INLINE_SELECT_TABLE_CLASS}
              value={row.groupId || null}
              options={groupOptionsForRow}
              onChange={async (groupId) => {
                await onGroupChange(row.id, groupId);
              }}
              placeholder={groupPlaceholder}
              clearLabel={tCommon('notAssigned')}
              disabled={isUpdating || !manualCenterId}
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
      header: t('registerDateLabel').toUpperCase(),
      sortable: true,
      className: COL.register,
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
      header: t('monthlyFeeLabel').toUpperCase(),
      sortable: true,
      className: COL.monthlyFee,
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) return <span className="text-[#8b8b90]">—</span>;
        const fee = typeof row.monthlyFee === 'string' ? parseFloat(row.monthlyFee) : Number(row.monthlyFee || 0);
        return (
          <div className="flex w-full justify-center" onClick={(e) => e.stopPropagation()}>
            <span className="whitespace-nowrap text-sm font-medium tabular-nums text-[#3b3b40]">
              {formatCurrency(fee)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'absence',
      header: t('attendance').toUpperCase(),
      sortable: true,
      className: COL.absence,
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
          <div className="flex w-full justify-center" onClick={(e) => e.stopPropagation()}>
            <span className="inline-flex min-w-[1.25rem] justify-center text-sm font-medium tabular-nums text-[#3b3b40]">
              {absencesThisMonth}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: tCommon('actions').toUpperCase(),
      className: COL.actions,
      render: (row: TeacherAssignedItem) => {
        if (isOnboardingItem(row)) {
          return (
            <span className="text-[#8b8b90] text-xs" onClick={(e) => e.stopPropagation()}>{tCommon('onboarding')}</span>
          );
        }
        const student = row;
        const isActive = student.user?.status === 'ACTIVE';
        const btnClass =
          'p-1 text-[#1010a3] hover:text-[#3b3b40] hover:bg-[#fafafa] rounded-lg transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

        return (
          <div
            className="flex w-full items-center justify-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label={t('feedback')}
              title={t('feedback')}
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

