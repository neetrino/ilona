'use client';

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
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Notes</h3>
      {isEditMode ? (
        <div className="space-y-2">
          <textarea
            {...register('notes')}
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Add notes about this student..."
          />
          {errors?.notes && (
            <p className="text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>
      ) : (
        <p className="text-slate-700 whitespace-pre-wrap">{student.notes || 'No notes'}</p>
      )}
    </div>
  );
}

