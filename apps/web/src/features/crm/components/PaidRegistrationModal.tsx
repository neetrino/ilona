'use client';

import { useState, useEffect, useMemo, useRef, useId, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { fetchLead, registerPaidLead } from '@/features/crm/api/crm.api';
import type { UpdateLeadDto } from '@/features/crm/types';
import { leadToCreateStudentFormDefaults } from '@/features/crm/lead-to-student-form-defaults';
import { useGroups } from '@/features/groups';
import { useTeachers } from '@/features/teachers';
import { useCenters } from '@/features/centers';
import { createStudentSchema, type CreateStudentFormData } from '@/features/students/student-account-form.schema';
import { formDataToCreateStudentDto } from '@/features/students/student-account-form.payload';
import { resolveAgeFromDobAndManual } from '@/features/students/student-account-form.age';
import { StudentAccountFormFields } from '@/features/students/components/StudentAccountFormFields';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  PORTAL_FORM_SHEET_SCROLL_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import {
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { useAuthStore } from '@/features/auth/store/auth.store';

export interface PaidRegistrationModalProps {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  formPrefill?: Partial<UpdateLeadDto>;
}

export function PaidRegistrationModal({
  open,
  leadId,
  onClose,
  onSuccess,
  formPrefill,
}: PaidRegistrationModalProps) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');
  const fieldIdPrefix = useId().replace(/:/g, '');
  const submitGuardRef = useRef(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'MANAGER';

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    enabled: open,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ isActive: true }, open);
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ status: 'ACTIVE' }, open);
  const { data: centersData, isLoading: isLoadingCenters } = useCenters({ isActive: true }, open);
  const teachers = teachersData?.items ?? [];
  const centers = useMemo(() => centersData?.items ?? [], [centersData?.items]);
  const managerCenterLabel = useMemo(() => {
    if (!isManager || !user?.managerCenterId) return null;
    const name = centers.find((c) => c.id === user.managerCenterId)?.name;
    return name ?? 'Your assigned branch';
  }, [centers, isManager, user?.managerCenterId]);

  const { data: lead, isLoading: isLoadingLead } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId && open,
  });

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

  const watchedDob = watch('dateOfBirth');
  const watchedManualAge = watch('manualAge');
  const computedAge = useMemo(
    () => resolveAgeFromDobAndManual(watchedDob, watchedManualAge),
    [watchedDob, watchedManualAge],
  );
  const showParentSection = computedAge !== undefined && computedAge < 18;

  useEffect(() => {
    if (!open) {
      reset();
      setApiError(null);
      return;
    }
    if (!lead || lead.id !== leadId) return;
    const fromLead = leadToCreateStudentFormDefaults(lead, formPrefill);
    if (isManager) {
      fromLead.centerId = '';
    }
    reset({
      ...{
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
      ...fromLead,
    });
  }, [open, lead, leadId, formPrefill, reset, isManager]);

  useEffect(() => {
    if (computedAge !== undefined && computedAge >= 18) {
      setValue('parentName', '');
      setValue('parentSurname', '');
      setValue('parentPhone', '');
      setValue('parentEmail', '');
      setValue('parentPassportInfo', '');
    }
  }, [computedAge, setValue]);

  const onValidSubmit = async (data: CreateStudentFormData) => {
    if (!leadId || submitGuardRef.current) return;
    setApiError(null);
    submitGuardRef.current = true;
    try {
      const payload = formDataToCreateStudentDto(data);
      if (isManager) {
        delete payload.centerId;
      }
      await registerPaidLead(leadId, payload);
      onSuccess();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      submitGuardRef.current = false;
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal
        open={open}
        dragStyle={dragStyle}
        contentClassName={portalFormSheetContentClass('2xl')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />
        <DialogPrimitive.Title className="sr-only">{t('studentRegistration')}</DialogPrimitive.Title>
        <div className={PORTAL_FORM_SHEET_HEADER_CLASS}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[#3b3b40]">{t('studentRegistration')}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Same details as Add New Student. Save to mark this lead Paid and create the account. Cancel
                leaves the lead status unchanged.
              </p>
            </div>
            <DialogPrimitive.Close
              className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
              aria-label={t('closeRegistration')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        {isLoadingLead || !lead ? (
          <div className={cn(PORTAL_FORM_SHEET_SCROLL_CLASS, 'p-8 text-center text-slate-500')}>
            {tCommon('loading')}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onValidSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            noValidate
          >
            <div className={cn(PORTAL_FORM_SHEET_SCROLL_CLASS, 'flex-1 pt-4 sm:pt-5')}>
              {apiError ? (
                <p className="mb-4 rounded-[15px] bg-red-50 p-2 text-sm text-red-600" role="alert">
                  {apiError}
                </p>
              ) : null}

              <StudentAccountFormFields
                idPrefix={fieldIdPrefix}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
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

              <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end min-[1367px]:pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestClose}
                  disabled={isSubmitting}
                  className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
                >
                  {isSubmitting ? 'Saving…' : 'Save & mark Paid'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
