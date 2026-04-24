'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { fetchLead, registerPaidLead } from '@/features/crm/api/crm.api';
import type { CrmLead, RegisterPaidLeadPayload, UpdateLeadDto } from '@/features/crm/types';
import { useModalClose } from '@/shared/hooks/useModalClose';
import { cn } from '@/shared/lib/utils';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

interface CenterOption {
  id: string;
  name: string;
}
interface TeacherOption {
  id: string;
  user?: { firstName?: string; lastName?: string };
}
interface GroupOption {
  id: string;
  name: string;
  teacherId?: string | null;
}

export interface PaidRegistrationModalProps {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
  /** Called after successful registration (lead is Paid + student created). */
  onSuccess: () => void;
  centers: CenterOption[];
  teachers: TeacherOption[];
  groups: GroupOption[];
  /** Unsaved Edit Lead form values take priority over fetched lead for prefill. */
  formPrefill?: Partial<UpdateLeadDto>;
}

type RegFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  age: string;
  dateOfBirth: string;
  firstLessonDate: string;
  parentName: string;
  parentPhone: string;
  parentPassportInfo: string;
  comment: string;
  levelId: string;
  teacherId: string;
  groupId: string;
  centerId: string;
};

function buildInitialForm(lead: CrmLead, prefill?: Partial<UpdateLeadDto>): RegFormState {
  const p = prefill ?? {};
  const phoneRaw = (p.phone ?? lead.phone ?? '').replace(/\D/g, '');
  return {
    firstName: (p.firstName ?? lead.firstName) ?? '',
    lastName: (p.lastName ?? lead.lastName) ?? '',
    phone: phoneRaw,
    age:
      p.age !== undefined && p.age !== null
        ? String(p.age)
        : lead.age != null
          ? String(lead.age)
          : '',
    dateOfBirth: (p.dateOfBirth ?? lead.dateOfBirth)?.slice(0, 10) ?? '',
    firstLessonDate: (p.firstLessonDate ?? lead.firstLessonDate)?.slice(0, 10) ?? '',
    parentName: (p.parentName ?? lead.parentName) ?? '',
    parentPhone: (p.parentPhone ?? lead.parentPhone ?? '').replace(/\D/g, ''),
    parentPassportInfo: (p.parentPassportInfo ?? lead.parentPassportInfo) ?? '',
    comment: (p.comment ?? lead.comment) ?? '',
    levelId: (p.levelId ?? lead.levelId) ?? '',
    teacherId: (p.teacherId ?? lead.teacherId) ?? '',
    groupId: (p.groupId ?? lead.groupId) ?? '',
    centerId: (p.centerId ?? lead.centerId) ?? '',
  };
}

function validateRegForm(f: RegFormState): string | null {
  if (!f.firstName.trim() || !f.lastName.trim()) return 'First and last name are required.';
  const phoneDigits = f.phone.replace(/\D/g, '');
  if (phoneDigits.length < 6) return 'Enter a valid phone number.';
  if (f.age === '' || Number.isNaN(Number(f.age)) || Number(f.age) < 0) return 'Age is required.';
  const ageNum = Number(f.age);
  if (!f.levelId) return 'Level is required.';
  if (!f.teacherId) return 'Teacher is required.';
  if (!f.groupId) return 'Group is required.';
  if (!f.centerId) return 'Center is required.';
  if (ageNum > 0 && ageNum < 18) {
    if (!f.parentName.trim()) return 'Parent name is required for students under 18.';
    const pp = f.parentPhone.replace(/\D/g, '');
    if (pp.length < 6) return 'Parent phone is required for students under 18.';
    if (!f.parentPassportInfo.trim()) return 'Parent passport details are required for students under 18.';
  }
  return null;
}

function toPayload(f: RegFormState): RegisterPaidLeadPayload {
  const age = Number(f.age);
  const out: RegisterPaidLeadPayload = {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    phone: f.phone.replace(/\D/g, ''),
    age,
    levelId: f.levelId,
    teacherId: f.teacherId,
    groupId: f.groupId,
    centerId: f.centerId,
  };
  if (f.dateOfBirth) out.dateOfBirth = f.dateOfBirth;
  if (f.firstLessonDate) out.firstLessonDate = f.firstLessonDate;
  if (age > 0 && age < 18) {
    out.parentName = f.parentName.trim();
    out.parentPhone = f.parentPhone.replace(/\D/g, '');
    out.parentPassportInfo = f.parentPassportInfo.trim();
  }
  if (f.comment.trim()) out.comment = f.comment.trim();
  return out;
}

export function PaidRegistrationModal({
  open,
  leadId,
  onClose,
  onSuccess,
  centers,
  teachers,
  groups,
  formPrefill,
}: PaidRegistrationModalProps) {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const { onOverlayMouseDown, onOverlayClick } = useModalClose({
    open,
    onClose,
    containerRef: modalContainerRef,
  });
  const [regForm, setRegForm] = useState<RegFormState | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submitGuardRef = useRef(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId && open,
  });

  const selectedTeacherId = regForm?.teacherId ?? '';
  const groupsForTeacher = useMemo(
    () => (selectedTeacherId ? groups.filter((g) => g.teacherId === selectedTeacherId) : []),
    [groups, selectedTeacherId],
  );

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open || !lead || lead.id !== leadId) {
      if (!open) setRegForm(null);
      return;
    }
    setRegForm(buildInitialForm(lead, formPrefill));
    setFieldError(null);
    setApiError(null);
  }, [open, lead, leadId, formPrefill]);

  useEffect(() => {
    if (!regForm) return;
    const selectedGroupId = regForm.groupId ?? '';
    if (!selectedTeacherId) {
      if (selectedGroupId) {
        setRegForm((prev) => (prev ? { ...prev, groupId: '' } : prev));
      }
      return;
    }
    if (selectedGroupId && !groupsForTeacher.some((g) => g.id === selectedGroupId)) {
      setRegForm((prev) => (prev ? { ...prev, groupId: '' } : prev));
    }
  }, [selectedTeacherId, regForm?.groupId, groupsForTeacher]);

  const handleSave = async () => {
    if (!leadId || !regForm || submitGuardRef.current) return;
    setFieldError(null);
    setApiError(null);
    const v = validateRegForm(regForm);
    if (v) {
      setFieldError(v);
      return;
    }
    submitGuardRef.current = true;
    setSubmitting(true);
    try {
      await registerPaidLead(leadId, toPayload(regForm));
      onSuccess();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
      submitGuardRef.current = false;
    }
  };

  if (!open || !mounted) return null;

  const ageNum = regForm?.age !== '' && !Number.isNaN(Number(regForm?.age)) ? Number(regForm?.age) : NaN;
  const showParent = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 18;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 overflow-y-auto transition-opacity duration-200"
      onMouseDown={onOverlayMouseDown}
      onClick={onOverlayClick}
    >
      <div className="flex min-h-full w-full items-center justify-center">
        <div
          ref={modalContainerRef}
          className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl transition-all duration-200 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]"
        >
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Student registration</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Complete required fields to mark this lead as Paid and create the student profile. Cancel to keep
                  the current status unchanged.
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

          {isLoading || !regForm ? (
            <div className="p-8 text-center text-slate-500">Loading…</div>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                {(fieldError || apiError) && (
                  <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600" role="alert">
                    {fieldError ?? apiError}
                  </p>
                )}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">First name *</label>
                    <input
                      type="text"
                      value={regForm.firstName}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, firstName: e.target.value } : f))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Last name *</label>
                    <input
                      type="text"
                      value={regForm.lastName}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, lastName: e.target.value } : f))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Phone *</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={regForm.phone ? `+${regForm.phone}` : '+'}
                      onChange={(e) =>
                        setRegForm((f) => (f ? { ...f, phone: e.target.value.replace(/\D/g, '') } : f))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Age *</label>
                    <input
                      type="number"
                      min={0}
                      value={regForm.age}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, age: e.target.value } : f))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Date of birth</label>
                    <input
                      type="date"
                      value={regForm.dateOfBirth}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, dateOfBirth: e.target.value } : f))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">First lesson date</label>
                    <input
                      type="date"
                      value={regForm.firstLessonDate}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, firstLessonDate: e.target.value } : f))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Level *</label>
                    <select
                      value={regForm.levelId}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, levelId: e.target.value } : f))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {LEVEL_OPTIONS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Teacher *</label>
                    <select
                      value={regForm.teacherId}
                      onChange={(e) =>
                        setRegForm((f) =>
                          f ? { ...f, teacherId: e.target.value, groupId: '' } : f,
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user?.firstName} {t.user?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Group *</label>
                    <select
                      value={regForm.groupId}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, groupId: e.target.value } : f))}
                      disabled={!selectedTeacherId}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">{selectedTeacherId ? '—' : 'Select teacher first'}</option>
                      {groupsForTeacher.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Center *</label>
                    <select
                      value={regForm.centerId}
                      onChange={(e) => setRegForm((f) => (f ? { ...f, centerId: e.target.value } : f))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {showParent && (
                  <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Parent / guardian (under 18)
                    </p>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Parent name *</label>
                      <input
                        type="text"
                        value={regForm.parentName}
                        onChange={(e) => setRegForm((f) => (f ? { ...f, parentName: e.target.value } : f))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Parent phone *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={regForm.parentPhone ? `+${regForm.parentPhone}` : '+'}
                        onChange={(e) =>
                          setRegForm((f) => (f ? { ...f, parentPhone: e.target.value.replace(/\D/g, '') } : f))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Parent passport details *
                      </label>
                      <input
                        type="text"
                        value={regForm.parentPassportInfo}
                        onChange={(e) =>
                          setRegForm((f) => (f ? { ...f, parentPassportInfo: e.target.value } : f))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </section>
                )}

                <section>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Comment</label>
                  <textarea
                    rows={2}
                    value={regForm.comment}
                    onChange={(e) => setRegForm((f) => (f ? { ...f, comment: e.target.value } : f))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </section>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={submitting}
                  className={cn(
                    'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50',
                  )}
                >
                  {submitting ? 'Saving…' : 'Save & mark Paid'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
