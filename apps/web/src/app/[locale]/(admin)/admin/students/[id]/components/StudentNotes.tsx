'use client';

import { useTranslations } from 'next-intl';
import type { Student } from '@/features/students';
import type { UseFormRegister } from 'react-hook-form';
import type { UpdateStudentFormData } from '../schemas';

interface StudentNotesProps {
  student: Student;
  isEditMode: boolean;
  errors?: {
    notes?: { message?: string };
  };
  register: UseFormRegister<UpdateStudentFormData>;
}

export function StudentNotes({
  student,
  isEditMode,
  errors,
  register,
}: StudentNotesProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  return (
    <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
      <h3 className="text-lg font-semibold text-[#3b3b40] mb-4">{tCommon('notes')}</h3>
      {isEditMode ? (
        <div className="space-y-2">
          <textarea
            {...register('notes')}
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder={t('notesPlaceholder')}
          />
          {errors?.notes && (
            <p className="text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>
      ) : (
        <p className="text-[#3b3b40] whitespace-pre-wrap">{student.notes || tCommon('noNotes')}</p>
      )}
    </div>
  );
}

