'use client';

import { useTranslations } from 'next-intl';
import type { Student } from '@/features/students';

interface StudentNotesProps {
  student: Student;
}

export function StudentNotes({ student }: StudentNotesProps) {
  const tCommon = useTranslations('common');
  return (
    <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
      <h3 className="text-lg font-semibold text-[#3b3b40] mb-4">{tCommon('notes')}</h3>
      <p className="text-[#3b3b40] whitespace-pre-wrap">{student.notes || tCommon('noNotes')}</p>
    </div>
  );
}
