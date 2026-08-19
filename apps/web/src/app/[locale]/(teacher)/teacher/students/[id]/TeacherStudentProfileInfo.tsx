'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui';
import { formatDate, formatPhoneForDisplay } from '@/shared/lib/utils';
import type { Student } from '@/features/students';

type TeacherRef = { user: { firstName: string; lastName: string } } | null | undefined;

function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#8b8b90]">{label}</label>
      <div className="mt-1 text-[#1010a3]">{value}</div>
    </div>
  );
}

function teacherFullName(teacher: TeacherRef): string | null {
  if (!teacher?.user) return null;
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`.trim();
  return name || null;
}

function ContactCard({ student }: { student: Student }) {
  const locale = useLocale();
  const t = useTranslations('students.teacherView');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const na = tStudents('notAvailable');
  const admissionDate = student.registerDate ?? student.enrolledAt ?? null;

  return (
    <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-[#1010a3]">{t('basicInfo')}</h3>
      <div className="space-y-4">
        <InfoField label={tCommon('firstName')} value={student.user?.firstName || na} />
        <InfoField label={tCommon('lastName')} value={student.user?.lastName || na} />
        <InfoField label={tCommon('phone')} value={formatPhoneForDisplay(student.user?.phone, na)} />
        <InfoField
          label={tStudents('parentPhone')}
          value={formatPhoneForDisplay(student.parentPhone, na)}
        />
        <InfoField
          label={t('centerAdmissionDate')}
          value={admissionDate ? formatDate(admissionDate, locale) : na}
        />
      </div>
    </div>
  );
}

function LearningCard({ student }: { student: Student }) {
  const t = useTranslations('students.teacherView');
  const tCommon = useTranslations('common');
  const tStudents = useTranslations('students');
  const assignedTeacher = student.teacher ?? student.group?.teacher ?? null;
  const secondTeacher =
    student.group?.secondTeacher && student.group.secondTeacher.id !== assignedTeacher?.id
      ? student.group.secondTeacher
      : null;

  return (
    <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-[#1010a3]">{t('learning')}</h3>
      <div className="space-y-4">
        <InfoField
          label={tCommon('group')}
          value={
            student.group ? (
              <div className="flex items-center gap-2">
                <Badge variant="info">{student.group.name}</Badge>
                {student.group.level ? (
                  <span className="text-sm text-[#8b8b90]">{student.group.level}</span>
                ) : null}
              </div>
            ) : (
              <span className="text-[#8b8b90]">{tCommon('notAssigned')}</span>
            )
          }
        />
        {student.group?.center || student.center ? (
          <InfoField
            label={tCommon('center')}
            value={student.group?.center?.name ?? student.center?.name ?? tStudents('notAvailable')}
          />
        ) : null}
        <InfoField
          label={tCommon('teacher')}
          value={teacherFullName(assignedTeacher) ?? tCommon('notAssigned')}
        />
        <InfoField
          label={tStudents('teacher2')}
          value={teacherFullName(secondTeacher) ?? tCommon('notAssigned')}
        />
      </div>
    </div>
  );
}

export function TeacherStudentProfileInfo({ student }: { student: Student }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ContactCard student={student} />
      <LearningCard student={student} />
    </div>
  );
}
