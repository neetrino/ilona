'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
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
import { useCenters } from '@/features/centers';
import { useState, useEffect, useMemo } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { createStudentSchema, type CreateStudentFormData } from '../student-account-form.schema';
import { formDataToCreateStudentDto } from '../student-account-form.payload';
import { resolveAgeFromDobAndManual } from '../student-account-form.age';
import { StudentAccountFormFieldsCrmLeadLayout } from './StudentAccountFormFieldsCrmLeadLayout';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface AddStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStudentForm({ open, onOpenChange }: AddStudentFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const createStudent = useCreateStudent();
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'MANAGER';

  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true });
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' });
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ isActive: true });
  const teachers = teachersData?.items ?? [];
  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);
  const managerCenterLabel = useMemo(() => {
    if (!isManager || !user?.managerCenterId) return null;
    const name = centers.find((c) => c.id === user.managerCenterId)?.name;
    return name ?? 'Your assigned branch';
  }, [centers, isManager, user?.managerCenterId]);

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
      manualAge: undefined,
      levelId: '',
      groupId: '',
      teacherId: '',
      centerId: '',
      parentName: '',
      parentSurname: '',
      parentPhone: '',
      parentEmail: '',
      parentPassportInfo: '',
      monthlyFee: 0,
      notes: '',
      receiveReports: true,
    },
  });

  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const watchedLevelId = watch('levelId') || '';
  const watchedDob = watch('dateOfBirth');
  const watchedManualAge = watch('manualAge');
  const computedAge = useMemo(
    () => resolveAgeFromDobAndManual(watchedDob, watchedManualAge),
    [watchedDob, watchedManualAge],
  );

  const groupsForTeacher = useMemo(() => {
    const allGroups = groupsData?.items ?? [];
    const byTeacher = watchedTeacherId ? allGroups.filter((g) => g.teacherId === watchedTeacherId) : [];
    if (!watchedLevelId) return byTeacher;
    return byTeacher.filter((g) => (g.level ?? '') === watchedLevelId);
  }, [groupsData?.items, watchedTeacherId, watchedLevelId]);

  useEffect(() => {
    if (!watchedTeacherId) {
      setValue('groupId', '');
      return;
    }
    if (!watchedGroupId) return;
    const g = groupsData?.items?.find((x) => x.id === watchedGroupId);
    if (g && (g.teacherId !== watchedTeacherId || (watchedLevelId && (g.level ?? '') !== watchedLevelId))) {
      setValue('groupId', '');
    }
  }, [watchedTeacherId, watchedGroupId, watchedLevelId, groupsData?.items, setValue]);

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
      setValue('parentSurname', '');
      setValue('parentPhone', '');
      setValue('parentEmail', '');
      setValue('parentPassportInfo', '');
    }
  }, [computedAge, setValue]);

  const onSubmit = async (data: CreateStudentFormData) => {
    setErrorMessage(null);
    try {
      const payload = formDataToCreateStudentDto(data);
      if (isManager) {
        delete payload.centerId;
      }
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Basic info and phone first, then account credentials, dates, parent details when under 18, academic
            assignment, then billing. Voice and lead comment stay on the CRM board only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <StudentAccountFormFieldsCrmLeadLayout
            register={register}
            setValue={setValue}
            errors={errors}
            watch={watch}
            computedAge={computedAge}
            showParentSection={showParentSection}
            groupsForTeacher={groupsForTeacher}
            teachers={teachers}
            centers={centers}
            isLoadingGroups={isLoadingGroups}
            isLoadingTeachers={isLoadingTeachers}
            isLoadingCenters={isLoadingCenters}
            isSubmitting={isSubmitting}
            showCenterSelect={!isManager}
            assignedCenterDisplay={isManager ? managerCenterLabel : null}
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
