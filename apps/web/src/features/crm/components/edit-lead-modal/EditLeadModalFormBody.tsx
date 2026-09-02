'use client';

import { cn } from '@/shared/lib/utils';
import { DatePickerInput, SegmentedControl } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { CrmStatusSelector } from '../CrmStatusSelector';
import { RecordingPlayback } from '../VoiceRecorder';
import { computeAgeFromDob } from '@/features/students/student-account-form.schema';
import { FORM_FIELD_CLASS } from './edit-lead-modal.constants';
import type { useEditLeadModal } from './useEditLeadModal';

type EditLeadModalFormBodyProps = ReturnType<typeof useEditLeadModal>;

export function EditLeadModalFormBody(props: EditLeadModalFormBodyProps) {
  const {
    t,
    tc,
    form,
    setForm,
    saving,
    error,
    availableStatuses,
    crmStatusPortaledMenuRef,
    voiceAttachments,
    effectiveAge,
    levelSegmentOptions,
    teacherOptions,
    groupOptions,
    centerOptions,
    selectedTeacherId,
    isManager,
    managerCenterReadonlyLabel,
    teachers,
    lead,
    handleCrmStatusChange,
    handleSubmit,
  } = props;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('voiceSection')}
        </h3>
        {voiceAttachments.length > 0 ? (
          <div className="space-y-2">
            {voiceAttachments.map((attachment) => (
              <RecordingPlayback
                key={attachment.id}
                r2Key={attachment.r2Key}
                mimeType={attachment.mimeType ?? 'audio/webm'}
                className="w-full"
              />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
            {t('noVoiceRecording')}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('comment')}</h3>
        <textarea
          rows={3}
          value={form.comment ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          placeholder={t('commentPlaceholder')}
          className={FORM_FIELD_CLASS}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('basicInfo')}</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('firstName')}</label>
            <input
              type="text"
              value={form.firstName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className={FORM_FIELD_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('lastName')}</label>
            <input
              type="text"
              value={form.lastName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className={FORM_FIELD_CLASS}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('phoneNumber')}</label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
              className={FORM_FIELD_CLASS}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('additionalInfo')}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('dateOfBirth')}</label>
            <DatePickerInput
              value={form.dateOfBirth ?? ''}
              onValueChange={(nextValue) => {
                const dateOfBirth = nextValue || undefined;
                const fromDob = computeAgeFromDob(dateOfBirth);
                setForm((f) => ({
                  ...f,
                  dateOfBirth,
                  age: fromDob ?? f.age,
                }));
              }}
              className={cn(FORM_FIELD_CLASS, 'h-auto min-h-0 pr-10')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('age')}</label>
            {form.dateOfBirth && effectiveAge !== undefined ? (
              <p className={cn(FORM_FIELD_CLASS, 'bg-slate-50 text-slate-800')}>{effectiveAge}</p>
            ) : (
              <input
                type="number"
                min={0}
                value={form.age ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    age: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className={FORM_FIELD_CLASS}
              />
            )}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('firstLessonDate')}</label>
            <DatePickerInput
              value={form.firstLessonDate ?? ''}
              onValueChange={(nextValue) =>
                setForm((f) => ({ ...f, firstLessonDate: nextValue || undefined }))
              }
              className={cn(FORM_FIELD_CLASS, 'h-auto min-h-0 pr-10')}
            />
          </div>
        </div>
      </section>

      {effectiveAge !== undefined && effectiveAge > 0 && effectiveAge < 18 && (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('parentDetailsUnder18')}
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('parentName')}</label>
            <input
              type="text"
              value={form.parentName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
              placeholder={t('parentNamePlaceholder')}
              className={FORM_FIELD_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('parentSurname')}</label>
            <input
              type="text"
              value={form.parentSurname ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, parentSurname: e.target.value }))}
              placeholder={t('parentSurnamePlaceholder')}
              className={FORM_FIELD_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('parentPhone')}</label>
            <input
              type="tel"
              inputMode="numeric"
              value={form.parentPhone != null && form.parentPhone !== '' ? `+${form.parentPhone}` : ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, parentPhone: e.target.value.replace(/\D/g, '') }))
              }
              placeholder={t('parentPhonePlaceholder')}
              className={FORM_FIELD_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('parentEmail')}</label>
            <input
              type="email"
              autoComplete="email"
              value={form.parentEmail ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, parentEmail: e.target.value }))}
              placeholder={t('parentEmailPlaceholder')}
              className={FORM_FIELD_CLASS}
            />
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('academicInfo')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('level')}</label>
            <SegmentedControl
              options={levelSegmentOptions}
              value={form.levelId ?? ''}
              onChange={(nextValue) => setForm((f) => ({ ...f, levelId: nextValue || undefined }))}
              allowDeselect
              aria-label={t('level')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('teacher')}</label>
            <SingleSelectDropdown
              id="edit-lead-teacher"
              options={teacherOptions}
              value={form.teacherId ?? ''}
              onValueChange={(nextValue) =>
                setForm((f) => ({
                  ...f,
                  teacherId: nextValue || undefined,
                  groupId: undefined,
                }))
              }
            />
            {isManager && teachers.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">{t('noTeachersForCenter')}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('group')}</label>
            <SingleSelectDropdown
              id="edit-lead-group"
              options={groupOptions}
              value={form.groupId ?? ''}
              onValueChange={(nextValue) => setForm((f) => ({ ...f, groupId: nextValue || undefined }))}
              disabled={!selectedTeacherId}
            />
          </div>
          {isManager ? (
            managerCenterReadonlyLabel ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t('center')}</label>
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {managerCenterReadonlyLabel}
                </p>
              </div>
            ) : null
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('center')}</label>
              <SingleSelectDropdown
                id="edit-lead-center"
                options={centerOptions}
                value={form.centerId ?? ''}
                onValueChange={(nextValue) =>
                  setForm((f) => ({ ...f, centerId: nextValue || undefined }))
                }
              />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tc('status')}</h3>
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <CrmStatusSelector
              id="edit-lead-status"
              value={form.status}
              options={availableStatuses}
              portaledMenuRef={crmStatusPortaledMenuRef}
              menuPlacement="top"
              onChange={handleCrmStatusChange}
              disabled={lead?.status === 'PAID'}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'inline-flex h-11 shrink-0 items-center justify-center rounded-[15px] bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50',
            )}
          >
            {saving ? t('saving') : tc('save')}
          </button>
        </div>
        {form.status === 'ARCHIVE' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('archiveReasonOptional')}
            </label>
            <input
              type="text"
              value={form.archivedReason ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, archivedReason: e.target.value || undefined }))
              }
              placeholder={t('archiveReasonPlaceholder')}
              className={FORM_FIELD_CLASS}
            />
          </div>
        )}
      </section>
    </form>
  );
}
