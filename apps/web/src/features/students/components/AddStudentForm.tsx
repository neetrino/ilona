'use client';


import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
} from '@/shared/components/ui';
import { useCreateStudent } from '../hooks/useStudents';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { filterAssignableGroupsByCenter } from '../lib/group-center-assignment';
import { useState, useEffect, useMemo, useCallback, useRef, type TouchEvent } from 'react';
import { getErrorMessage } from '@/shared/lib/api';
import {
  createStudentWithConfirmSchema,
  type CreateStudentWithConfirmFormData,
} from '../student-account-form.schema';
import { formDataToCreateStudentDto } from '../student-account-form.payload';
import { resolveAgeFromDobAndManual } from '../student-account-form.age';
import { StudentAccountFormFieldsCrmLeadLayout } from './StudentAccountFormFieldsCrmLeadLayout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { DEFAULT_GROUP_LEVEL } from '@/features/groups/lib/group-level-options';
import {
  portalSheetLayerProps,
  stackedSheetDialogHandlers,
  useSheetStackZIndex,
} from '@/shared/lib/sheet-stack';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import { X } from 'lucide-react';

interface AddStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStudentForm({ open, onOpenChange }: AddStudentFormProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const tForm = useTranslations('students.form');
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
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ isActive: true });
  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);
  const defaultCenterId = centers[0]?.id ?? '';
  const allGroups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);
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
    getValues,
  } = useForm<CreateStudentWithConfirmFormData>({
    resolver: zodResolver(createStudentWithConfirmSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      firstLessonDate: '',
      manualAge: undefined,
      levelId: DEFAULT_GROUP_LEVEL,
      groupId: '',
      teacherId: '',
      centerId: '',
      parentName: '',
      parentSurname: '',
      parentPhone: '',
      parentEmail: '',
      parentPassportInfo: '',
      monthlyFee: undefined,
      notes: '',
      receiveReports: true,
    },
  });

  const watchedCenterId = watch('centerId') || '';
  const effectiveCenterId = useMemo(
    () => (isManager && user?.managerCenterId ? user.managerCenterId : watchedCenterId) || '',
    [isManager, user?.managerCenterId, watchedCenterId],
  );
  const watchedGroupId = watch('groupId') || '';
  const watchedLevelId = watch('levelId') || '';
  const watchedDob = watch('dateOfBirth');
  const watchedManualAge = watch('manualAge');
  const computedAge = useMemo(
    () => resolveAgeFromDobAndManual(watchedDob, watchedManualAge),
    [watchedDob, watchedManualAge],
  );

  const groupsForCenter = useMemo(
    () =>
      filterAssignableGroupsByCenter(
        allGroups,
        effectiveCenterId || undefined,
        watchedLevelId || undefined,
      ),
    [allGroups, effectiveCenterId, watchedLevelId],
  );

  useEffect(() => {
    if (!effectiveCenterId) {
      setValue('groupId', '');
      setValue('teacherId', '');
      return;
    }
    if (!watchedGroupId) return;
    const group = allGroups.find((g) => g.id === watchedGroupId);
    if (!group || group.centerId !== effectiveCenterId) {
      setValue('groupId', '');
      setValue('teacherId', '');
    }
  }, [effectiveCenterId, watchedGroupId, allGroups, setValue]);

  useEffect(() => {
    if (!watchedGroupId) {
      setValue('teacherId', '');
      return;
    }
    const group = allGroups.find((g) => g.id === watchedGroupId);
    if (group?.teacherId) {
      setValue('teacherId', group.teacherId);
      return;
    }
    setValue('groupId', '');
    setValue('teacherId', '');
  }, [watchedGroupId, allGroups, setValue]);

  const showParentSection = computedAge !== undefined && computedAge < 18;

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open || isLoadingCenters || !defaultCenterId || isManager) return;
    if (!getValues('centerId')) {
      setValue('centerId', defaultCenterId, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [open, isLoadingCenters, defaultCenterId, getValues, setValue, isManager]);

  useEffect(() => {
    if (open) {
      reset({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        firstLessonDate: '',
        manualAge: undefined,
        levelId: DEFAULT_GROUP_LEVEL,
        groupId: '',
        teacherId: '',
        centerId: isManager && user?.managerCenterId ? user.managerCenterId : defaultCenterId,
        parentName: '',
        parentSurname: '',
        parentPhone: '',
        parentEmail: '',
        parentPassportInfo: '',
        monthlyFee: undefined,
        notes: '',
        receiveReports: true,
      });
      setErrorMessage(null);
      setSuccessMessage(null);
    } else {
      setDragOffsetY(0);
      setIsDragging(false);
      setIsSettling(false);
    }
  }, [open, reset, defaultCenterId, isManager, user?.managerCenterId]);

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
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches;

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

  const onSubmit = async (data: CreateStudentWithConfirmFormData) => {
    setErrorMessage(null);
    try {
      const payload = formDataToCreateStudentDto(data);
      if (isManager) {
        delete payload.centerId;
      }
      await createStudent.mutateAsync(payload);
      setSuccessMessage(tForm('createdSuccess'));
      setErrorMessage(null);
      reset({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        firstLessonDate: '',
        manualAge: undefined,
        levelId: DEFAULT_GROUP_LEVEL,
        groupId: '',
        teacherId: '',
        centerId: isManager && user?.managerCenterId ? user.managerCenterId : defaultCenterId,
        parentName: '',
        parentSurname: '',
        parentPhone: '',
        parentEmail: '',
        parentPassportInfo: '',
        monthlyFee: undefined,
        notes: '',
        receiveReports: true,
      });
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, tForm('failedCreate')));
      setSuccessMessage(null);
    }
  };
  const { overlayStyle, contentStyle } = useSheetStackZIndex(isDialogOpen);

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={overlayStyle}
          {...portalSheetLayerProps}
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          style={{ ...dragStyle, ...contentStyle }}
          {...stackedSheetDialogHandlers}
          {...portalSheetLayerProps}
          className={cn(
            'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
            'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
            'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
            'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
            PORTAL_DESKTOP_SIDE_SHEET_CLASS,
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden">
            <div
              className="absolute inset-x-0 -top-2 h-14"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
            />
            <div className="h-1.5 w-14 rounded-full bg-slate-400" />
          </div>
          <DialogPrimitive.Title className="sr-only">{t('addNewStudent')}</DialogPrimitive.Title>
          <div className="shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[#3b3b40]">{t('addNewStudent')}</h2>
              </div>
              <DialogPrimitive.Close
                className={cn(
                  ADMIN_ICON_BUTTON_SM_CLASS,
                  'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex',
                )}
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {successMessage && (
                <div className="rounded-[15px] border border-green-200 bg-green-50 p-3">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}
              {errorMessage && (
                <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
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
            groupsForCenter={groupsForCenter}
            centers={centers}
            isLoadingGroups={isLoadingGroups}
            isLoadingCenters={isLoadingCenters}
            isSubmitting={isSubmitting}
            showCenterSelect={!isManager}
            assignedCenterDisplay={isManager ? managerCenterLabel : null}
            lockedCenterId={isManager ? user?.managerCenterId ?? null : null}
          />

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
                  onClick={requestClose}
                  disabled={isSubmitting || createStudent.isPending}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting || createStudent.isPending}
                  className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
                >
                  {isSubmitting || createStudent.isPending ? tForm('creating') : tForm('createStudent')}
                </Button>
              </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
