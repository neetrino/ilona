'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui';
import { useCreateStudent } from '../hooks/useStudents';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import {
  createStudentSchema,
  computeAgeFromDob,
  type CreateStudentFormData,
} from '../student-account-form.schema';
import { formDataToCreateStudentDto } from '../student-account-form.payload';
import { StudentAccountFormFields } from './StudentAccountFormFields';

interface AddStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStudentForm({ open, onOpenChange }: AddStudentFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createStudent = useCreateStudent();

  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });
  const teachers = teachersData?.items ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      firstLessonDate: '',
      age: undefined as number | undefined,
      groupId: '',
      teacherId: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      parentPassportInfo: '',
      monthlyFee: 0,
      notes: '',
      receiveReports: true,
    },
  });

  const watchedTeacherId = watch('teacherId') || '';
  const groupsForTeacher = useMemo(() => {
    const allGroups = groupsData?.items ?? [];
    return watchedTeacherId ? allGroups.filter((g) => g.teacherId === watchedTeacherId) : [];
  }, [groupsData?.items, watchedTeacherId]);
  useEffect(() => {
    if (!watchedTeacherId) setValue('groupId', '');
  }, [watchedTeacherId, setValue]);

  const dob = watch('dateOfBirth');
  const computedAge = useMemo(() => computeAgeFromDob(dob), [dob]);
  useEffect(() => {
    if (computedAge !== undefined) setValue('age', computedAge, { shouldValidate: false });
  }, [computedAge, setValue]);
  const showParentSection = computedAge !== undefined && computedAge < 18;

  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open, reset]);

  useEffect(() => {
    if (computedAge !== undefined && computedAge >= 18) {
      setValue('parentName', '');
      setValue('parentPhone', '');
      setValue('parentEmail', '');
      setValue('parentPassportInfo', '');
    }
  }, [computedAge, setValue]);

  const onSubmit = async (data: CreateStudentFormData) => {
    setErrorMessage(null);
    try {
      const payload = formDataToCreateStudentDto(data, computedAge);
      await createStudent.mutateAsync(payload);
      setSuccessMessage('Student created successfully!');
      setErrorMessage(null);
      reset();
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Failed to create student. Please try again.'));
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new student account. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <StudentAccountFormFields
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            computedAge={computedAge}
            showParentSection={showParentSection}
            groupsForTeacher={groupsForTeacher}
            teachers={teachers}
            isLoadingGroups={isLoadingGroups}
            isLoadingTeachers={isLoadingTeachers}
            isSubmitting={isSubmitting}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              disabled={isSubmitting || createStudent.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createStudent.isPending}>
              {isSubmitting || createStudent.isPending ? 'Creating...' : 'Create Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
