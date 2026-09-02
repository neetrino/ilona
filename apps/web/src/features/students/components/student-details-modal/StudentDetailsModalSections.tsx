import type { ReactNode } from 'react';
import {
  Building2,
  Calendar,
  CircleDollarSign,
  GraduationCap,
  Mail,
  Phone,
  UserRound,
  UserCircle,
  Users,
} from 'lucide-react';
import { formatCurrency, formatPhoneForDisplay } from '@/shared/lib/utils';
import { formatDateOfBirth, formatDisplayDate } from './student-details-modal.util';
import { StudentDetailsModalField } from './StudentDetailsModalField';
import { ParentIcon } from './ParentIcon';
import type { StudentDetailsVisibility } from './student-details-modal.visibility';
import type { Student } from '../../types';

type Translate = (key: string) => string;

type SectionProps = {
  student: Student;
  locale: string;
  visibility: StudentDetailsVisibility;
  t: Translate;
  tTeachers: Translate;
};

function IconLabel({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <>
      {icon}
      {text}
    </>
  );
}

export function StudentDetailsModalBasicInfo({
  student,
  locale,
  visibility,
  t,
  tTeachers,
}: SectionProps) {
  const admissionDate = student.registerDate ?? student.enrolledAt ?? null;
  const monthlyFee =
    typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) : Number(student.monthlyFee || 0);

  return (
    <div className="space-y-5 pt-[10px] min-[1367px]:pt-0">
      <h4 className="text-base font-semibold text-slate-800 sm:text-lg">{tTeachers('basicInformation')}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1367px]:flex min-[1367px]:gap-3">
        <StudentDetailsModalField
          label={<IconLabel icon={<Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={tTeachers('phoneNumber')} />}
          value={formatPhoneForDisplay(student.user?.phone, tTeachers('noPhoneNumber'))}
        />
        <StudentDetailsModalField
          label={<IconLabel icon={<UserCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={t('dateOfBirth')} />}
          value={formatDateOfBirth(student.dateOfBirth, locale)}
        />
        <StudentDetailsModalField
          label={<IconLabel icon={<Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={visibility.useAdmissionDate ? t('registerDateLabel') : t('memberSince')} />}
          value={formatDisplayDate(visibility.useAdmissionDate ? admissionDate : student.user?.createdAt, locale)}
        />
        {visibility.monthlyFee ? (
          <StudentDetailsModalField
            label={<IconLabel icon={<CircleDollarSign className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={t('monthlyFeeLabel')} />}
            value={formatCurrency(monthlyFee)}
          />
        ) : null}
      </div>
    </div>
  );
}

export function StudentDetailsModalEnrollment({
  student,
  locale,
  visibility,
  t,
  tTeachers,
  assignedTeacherName,
  secondTeacherName,
}: SectionProps & { assignedTeacherName: string; secondTeacherName: string | null }) {
  return (
    <div className="mt-8 space-y-5">
      <h4 className="flex items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg">
        <GraduationCap className="h-4 w-4 text-slate-500" aria-hidden="true" />
        {t('enrollmentSection')}
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1367px]:flex min-[1367px]:gap-3">
        <StudentDetailsModalField
          label={<IconLabel icon={<Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={t('group')} />}
          value={student.group ? `${student.group.name}${student.group.level ? ` (${student.group.level})` : ''}` : '—'}
        />
        <StudentDetailsModalField
          label={<IconLabel icon={<UserRound className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={t('teacher')} />}
          value={assignedTeacherName}
        />
        {visibility.alwaysShowTeacher2 || secondTeacherName ? (
          <StudentDetailsModalField
            label={<IconLabel icon={<UserRound className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={t('teacher2')} />}
            value={secondTeacherName ?? '—'}
          />
        ) : null}
        {student.center?.name || student.group?.center?.name ? (
          <StudentDetailsModalField
            className="sm:col-span-2 min-[1367px]:col-span-1"
            label={<IconLabel icon={<Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={tTeachers('centers')} />}
            value={student.center?.name ?? student.group?.center?.name}
          />
        ) : null}
        {!visibility.useAdmissionDate && student.registerDate ? (
          <StudentDetailsModalField
            className="sm:col-span-2 min-[1367px]:col-span-1"
            label={t('registerDateLabel')}
            value={formatDisplayDate(student.registerDate, locale)}
          />
        ) : null}
      </div>
    </div>
  );
}

export function StudentDetailsModalParentContact({
  student,
  visibility,
  t,
}: Pick<SectionProps, 'student' | 'visibility' | 't'>) {
  const showParent =
    visibility.alwaysShowParentContact ||
    Boolean(
      student.parentName ||
        student.parentPhone ||
        (visibility.parentEmail && student.parentEmail),
    );
  if (!showParent) return null;

  return (
    <div className="mt-8 space-y-5">
      <h4 className="flex items-center gap-2 text-base font-semibold text-slate-800 sm:text-lg">
        <ParentIcon className="h-4 w-4 text-slate-500" />
        {t('parentContact')}
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1367px]:flex min-[1367px]:gap-3">
        {student.parentName ? (
          <StudentDetailsModalField
            label={<IconLabel icon={<ParentIcon className="h-4 w-4 shrink-0 text-slate-400" />} text={t('parentName')} />}
            value={student.parentName}
          />
        ) : null}
        {visibility.alwaysShowParentContact || student.parentPhone ? (
          <StudentDetailsModalField
            label={<IconLabel icon={<Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={t('parentPhone')} />}
            value={formatPhoneForDisplay(student.parentPhone)}
          />
        ) : null}
        {visibility.parentEmail && student.parentEmail ? (
          <StudentDetailsModalField
            label={<IconLabel icon={<Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />} text={t('parentEmail')} />}
            value={student.parentEmail}
          />
        ) : null}
      </div>
    </div>
  );
}
