'use client';

import { Badge } from '@/shared/components/ui';
import { ActionButtons } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib/utils';
import type { Student } from '@/features/students';

interface StudentCardProps {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
  onDeactivate: () => void;
}

export function StudentCard({ student, onEdit, onDelete, onDeactivate }: StudentCardProps) {
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

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Student Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight flex-1">
            {fullName}
          </h4>
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




