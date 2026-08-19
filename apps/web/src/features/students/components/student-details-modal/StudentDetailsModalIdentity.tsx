'use client';

import { Avatar, Badge } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { Mail } from 'lucide-react';
import { formatLifecycle } from './student-details-modal.util';
import { StudentAccountStatusBadge } from './StudentAccountStatusBadge';
import type { Student } from '../../types';

type StudentDetailsModalIdentityProps = {
  student: Student;
  fullName: string;
  isUserActive: boolean;
  showEmail: boolean;
  viewFullPhotoLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  onPhotoPreview: () => void;
};

function StatusRow({
  fullName,
  isUserActive,
  student,
  activeLabel,
  inactiveLabel,
}: Pick<
  StudentDetailsModalIdentityProps,
  'fullName' | 'isUserActive' | 'student' | 'activeLabel' | 'inactiveLabel'
>) {
  return (
    <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
      <h3
        className={cn(
          'text-2xl font-bold leading-tight',
          isUserActive ? 'text-slate-800' : 'text-slate-500',
        )}
      >
        {fullName}
      </h3>
      <StudentAccountStatusBadge
        isActive={isUserActive}
        activeLabel={activeLabel}
        inactiveLabel={inactiveLabel}
      />
      {student.status && student.status !== 'ACTIVE' && student.status !== 'INACTIVE' ? (
        <Badge variant="default">{formatLifecycle(student.status)}</Badge>
      ) : null}
    </div>
  );
}

export function StudentDetailsModalIdentity({
  student,
  fullName,
  isUserActive,
  showEmail,
  viewFullPhotoLabel,
  activeLabel,
  inactiveLabel,
  onPhotoPreview,
}: StudentDetailsModalIdentityProps) {
  const email = showEmail ? student.user?.email : undefined;

  return (
    <>
      <div className="space-y-4 pb-6 sm:hidden">
        <button
          type="button"
          onClick={() => student.user?.avatarUrl && onPhotoPreview()}
          className={cn(
            'flex-shrink-0 overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
            !student.user?.avatarUrl && 'pointer-events-none cursor-default',
          )}
          aria-label={student.user?.avatarUrl ? viewFullPhotoLabel : undefined}
        >
          <Avatar
            src={student.user?.avatarUrl}
            name={fullName}
            size="xl"
            className="h-40 w-40 rounded-full"
            alt={fullName}
          />
        </button>
        <div className="min-w-0">
          <StatusRow
            fullName={fullName}
            isUserActive={isUserActive}
            student={student}
            activeLabel={activeLabel}
            inactiveLabel={inactiveLabel}
          />
          {email ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <p className="truncate">{email}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden items-start gap-6 pb-6 sm:flex">
        <button
          type="button"
          onClick={() => student.user?.avatarUrl && onPhotoPreview()}
          className={cn(
            'flex-shrink-0 overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 min-[1367px]:rounded-xl',
            !student.user?.avatarUrl && 'pointer-events-none cursor-default',
          )}
          aria-label={student.user?.avatarUrl ? viewFullPhotoLabel : undefined}
        >
          <Avatar
            src={student.user?.avatarUrl}
            name={fullName}
            size="xl"
            className="h-56 w-56 rounded-full lg:h-64 lg:w-64 min-[1367px]:rounded-xl"
            alt={fullName}
          />
        </button>
        <div className="min-w-0 flex-1">
          <StatusRow
            fullName={fullName}
            isUserActive={isUserActive}
            student={student}
            activeLabel={activeLabel}
            inactiveLabel={inactiveLabel}
          />
          {email ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <p className="truncate">{email}</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
