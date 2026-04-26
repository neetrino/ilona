'use client';

import { Badge, ActionButtons, Avatar } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { formatCurrency } from '@/shared/lib/utils';
import type { Student } from '@/features/students';

const NEW_STUDENT_BADGE_DAYS = 30;

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

interface StudentCardProps {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
  onDeactivate: () => void;
  onCardClick?: (student: Student) => void;
}

export function StudentCard({ student, onEdit, onDelete, onDeactivate, onCardClick }: StudentCardProps) {
  const firstName = student.user?.firstName || '';
  const lastName = student.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const phone = student.user?.phone || 'No phone';
  const teacherName = student.teacher
    ? `${student.teacher.user.firstName} ${student.teacher.user.lastName}`
    : null;
  const monthlyFee = typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) : Number(student.monthlyFee || 0);
  const attendance = student.attendanceSummary;
  const isActive = student.user?.status === 'ACTIVE';
  const showNewBadge = isNewPaidStudent(student);
  const riskBadge = getRiskBadge(student.derivedRiskLabel ?? student.riskLabel);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 p-4 shadow-sm transition-shadow',
        onCardClick && 'hover:shadow-md cursor-pointer',
      )}
      onClick={() => onCardClick?.(student)}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={
        onCardClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick(student);
              }
            }
          : undefined
      }
    >
      {/* Student Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar
                src={student.user?.avatarUrl}
                name={fullName}
                size="sm"
              />
              {showNewBadge && (
                <span className="absolute -left-2 top-[14%] -translate-y-1/2 -rotate-12 inline-flex items-center px-1 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-[0.08em] bg-emerald-500 text-white shadow-sm pointer-events-none">
                  NEW
                </span>
              )}
            </div>
            <h4 className="font-semibold text-slate-800 text-sm leading-tight truncate">
              {fullName}
            </h4>
            {riskBadge && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${riskBadge.className}`}
              >
                {riskBadge.label}
              </span>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ActionButtons
              onEdit={onEdit}
              onDisable={onDeactivate}
              onDelete={onDelete}
              isActive={isActive}
              size="sm"
              ariaLabels={{
                edit: 'Edit student',
                disable: isActive ? 'Deactivate student' : 'Activate student',
                delete: 'Delete student',
              }}
              titles={{
                edit: 'Edit student',
                disable: isActive ? 'Deactivate student' : 'Activate student',
                delete: 'Delete student',
              }}
            />
          </div>
        </div>
      </div>

      {/* Student Details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="truncate" title={phone}>{phone}</span>
        </div>

        {teacherName && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate" title={teacherName}>{teacherName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatCurrency(monthlyFee)}</span>
        </div>

        {student.groupId && attendance && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{attendance.totalClasses}/{attendance.absences}</span>
          </div>
        )}

        {!isActive && (
          <div className="pt-1">
            <Badge variant="warning" className="text-xs py-0.5 px-2">
              Inactive
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}







