'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
} from '@/shared/components/ui';
import { useCreateStudent } from '../hooks/useStudents';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useCenters } from '@/features/centers';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import { createStudentSchema, type CreateStudentFormData } from '../student-account-form.schema';
import { formDataToCreateStudentDto } from '../student-account-form.payload';
import { resolveAgeFromDobAndManual } from '../student-account-form.age';
import { StudentAccountFormFieldsCrmLeadLayout } from './StudentAccountFormFieldsCrmLeadLayout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';

interface AddStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStudentForm({ open, onOpenChange }: AddStudentFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const watchedCenterId = watch('centerId') || '';
  const effectiveCenterId = useMemo(
    () => (isManager && user?.managerCenterId ? user.managerCenterId : watchedCenterId) || '',
    [isManager, user?.managerCenterId, watchedCenterId],
  );
  const watchedTeacherId = watch('teacherId') || '';
  const watchedGroupId = watch('groupId') || '';
  const watchedLevelId = watch('levelId') || '';
  const watchedDob = watch('dateOfBirth');
  const watchedManualAge = watch('manualAge');
  const computedAge = useMemo(
    () => resolveAgeFromDobAndManual(watchedDob, watchedManualAge),
    [watchedDob, watchedManualAge],
  );

  const assignmentGroups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);

  const groupsForTeacher = useMemo(() => {
    const allGroups = groupsData?.items ?? [];
    let byTeacher = watchedTeacherId ? allGroups.filter((g) => g.teacherId === watchedTeacherId) : [];
    if (effectiveCenterId) {
      byTeacher = byTeacher.filter((g) => g.centerId === effectiveCenterId);
    }
    if (!watchedLevelId) return byTeacher;
    return byTeacher.filter((g) => (g.level ?? '') === watchedLevelId);
  }, [groupsData?.items, watchedTeacherId, watchedLevelId, effectiveCenterId]);

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
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset();
      setErrorMessage(null);
      setSuccessMessage(null);
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open, reset]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  const resetDragRefs = () => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  };

  const handleDragStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = firstTouch.clientY;
    touchStartXRef.current = firstTouch.clientX;
    setIsSettling(false);
    setIsDragging(true);
  };

  const handleDragMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isMobileViewport()) return;
    if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    const deltaY = firstTouch.clientY - touchStartYRef.current;
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    if (deltaY <= 0 || deltaY <= deltaX) return;
    event.preventDefault();
    setDragOffsetY(Math.min(deltaY * 0.95, 340));
  };

  const handleDragEnd = () => {
    if (!isMobileViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      requestClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  };

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

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
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={dragStyle}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out sheet:duration-350 sheet:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            'sheet:inset-0 sheet:m-auto sheet:w-[95vw] sheet:max-w-3xl sheet:h-auto sheet:max-h-[90vh] sheet:translate-x-0 sheet:translate-y-0 sheet:rounded-2xl',
            'sheet:data-[state=open]:fade-in-0 sheet:data-[state=closed]:fade-out-0 sheet:data-[state=open]:slide-in-from-bottom-0 sheet:data-[state=closed]:slide-out-to-bottom-0'
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] sheet:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">Add New Student</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 sheet:inline-flex"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
          <div className="overflow-y-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sheet:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#3b3b40]">Add New Student</h2>
              <p className="mt-1 text-sm text-[#8b8b90]">
                Basic info and phone first, then account credentials, dates, parent details when under 18, academic
                assignment, then billing. Voice and lead comment stay on the CRM board only.
              </p>
            </div>

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
            lockedCenterId={isManager ? user?.managerCenterId ?? null : null}
            groupsForAssignmentFilter={assignmentGroups}
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                requestClose();
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
          </div>
        </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
