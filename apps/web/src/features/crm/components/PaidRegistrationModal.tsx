'use client';

import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
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
import {
  createStudentSchema,
  computeAgeFromDob,
  type CreateStudentFormData,
} from '@/features/students/student-account-form.schema';
import { formDataToCreateStudentDto } from '@/features/students/student-account-form.payload';
import { StudentAccountFormFields } from '@/features/students/components/StudentAccountFormFields';
import { useModalClose } from '@/shared/hooks/useModalClose';
import { cn } from '@/shared/lib/utils';
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
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const fieldIdPrefix = useId().replace(/:/g, '');
  const { onOverlayMouseDown, onOverlayClick } = useModalClose({
    open,
    onClose,
    containerRef: modalContainerRef,
  });
  const submitGuardRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'MANAGER';

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
      age: undefined,
      groupId: '',
      teacherId: '',
      centerId: '',
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
  const watchedGroupId = watch('groupId') || '';
  const groupsForTeacher = useMemo(() => {
    const allGroups = groupsData?.items ?? [];
    return watchedTeacherId ? allGroups.filter((g) => g.teacherId === watchedTeacherId) : [];
  }, [groupsData?.items, watchedTeacherId]);

  useEffect(() => {
    if (!watchedTeacherId) {
      setValue('groupId', '');
      return;
    }
    if (!watchedGroupId) return;
    const g = groupsData?.items?.find((x) => x.id === watchedGroupId);
    if (g && g.teacherId !== watchedTeacherId) {
      setValue('groupId', '');
    }
  }, [watchedTeacherId, watchedGroupId, groupsData?.items, setValue]);

  const dob = watch('dateOfBirth');
  const computedAge = useMemo(() => computeAgeFromDob(dob), [dob]);
  useEffect(() => {
    if (computedAge !== undefined) setValue('age', computedAge, { shouldValidate: false });
  }, [computedAge, setValue]);
  const showParentSection = computedAge !== undefined && computedAge < 18;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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
        age: undefined,
        groupId: '',
        teacherId: '',
        centerId: '',
        parentName: '',
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
      const payload = formDataToCreateStudentDto(data, computedAge);
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

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-y-auto transition-opacity duration-200"
      onMouseDown={onOverlayMouseDown}
      onClick={onOverlayClick}
    >
      <div className="flex min-h-full w-full items-center justify-center">
        <div
          ref={modalContainerRef}
          className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl transition-all duration-200 max-h-[90vh] sm:max-h-[calc(100vh-2rem)]"
        >
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Student registration</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Same details as Add New Student. Save to mark this lead Paid and create the account. Cancel leaves
                  the lead status unchanged.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close registration"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isLoadingLead || !lead ? (
            <div className="p-8 text-center text-slate-500">Loading…</div>
          ) : (
            <form
              onSubmit={handleSubmit(onValidSubmit)}
              className="flex min-h-0 flex-1 flex-col"
              noValidate
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                {apiError && (
                  <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600" role="alert">
                    {apiError}
                  </p>
                )}

                <StudentAccountFormFields
                  idPrefix={fieldIdPrefix}
                  register={register}
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
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50',
                  )}
                >
                  {isSubmitting ? 'Saving…' : 'Save & mark Paid'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
