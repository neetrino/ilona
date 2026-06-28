'use client';

import type { ReactNode } from 'react';
import { ClipboardList, CircleDollarSign, Phone, UserCircle } from 'lucide-react';
import { Avatar } from '@/shared/components/ui';
import { cn, formatCurrency, formatPhoneForDisplay } from '@/shared/lib/utils';
import type { Student } from '@/features/students';
import { useTranslations } from 'next-intl';

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

function InfoRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#1010a3]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#8b8b90]">{label}</p>
        <p className={cn('truncate text-sm font-semibold text-[#1e293b]', valueClassName)} title={typeof value === 'string' ? value : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface StudentCardProps {
  student: Student;
  onCardClick?: (student: Student) => void;
}

export function StudentCard({ student, onCardClick }: StudentCardProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');

  const firstName = student.user?.firstName || '';
  const lastName = student.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || '—';
  const phone = formatPhoneForDisplay(student.user?.phone, t('noPhone'));
  const contactPerson = student.parentName?.trim() || '—';
  const monthlyFee = typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) : Number(student.monthlyFee || 0);
  const attendance = student.attendanceSummary;
  const showNewBadge = isNewPaidStudent(student);
  const statValue = attendance ? `${attendance.totalClasses}/${attendance.absences}` : '—';

  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-shadow',
        onCardClick && 'cursor-pointer hover:shadow-[0_8px_30px_rgba(15,23,42,0.1)]',
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
      <div className="mb-4 flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar
            src={student.user?.avatarUrl}
            name={fullName}
            size="md"
            className="h-11 w-11 bg-[#eef2ff] text-sm font-bold text-[#1010a3]"
          />
          {showNewBadge && (
            <span className="pointer-events-none absolute -left-1.5 top-0 -rotate-12 rounded px-1 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] bg-emerald-500 text-white shadow-sm">
              NEW
            </span>
          )}
        </div>
        <h4 className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-[#1e293b]">
          {fullName}
        </h4>
      </div>

      <div className="divide-y divide-slate-100">
        <InfoRow icon={<Phone className="h-4 w-4" aria-hidden="true" />} label={tCommon('phone')} value={phone} />
        <InfoRow
          icon={<UserCircle className="h-4 w-4" aria-hidden="true" />}
          label={t('parentName')}
          value={contactPerson}
        />
        <InfoRow
          icon={<CircleDollarSign className="h-4 w-4" aria-hidden="true" />}
          label={t('monthlyFeeLabel')}
          value={formatCurrency(monthlyFee)}
          valueClassName="text-[#1010a3]"
        />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f0f4ff] p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1010a3] shadow-sm">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-[#8b8b90]">{t('attendance')}</p>
          <p className="text-sm font-semibold text-[#1e293b]">{statValue}</p>
        </div>
      </div>
    </div>
  );
}
