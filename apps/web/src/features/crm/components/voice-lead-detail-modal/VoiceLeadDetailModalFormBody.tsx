'use client';

import { useTranslations } from 'next-intl';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import type { useVoiceLeadDetailModal } from './useVoiceLeadDetailModal';

type VoiceLeadDetailModalFormBodyProps = Pick<
  ReturnType<typeof useVoiceLeadDetailModal>,
  | 'form'
  | 'setForm'
  | 'phoneError'
  | 'setPhoneError'
  | 'selectedTeacherId'
  | 'levelOptions'
  | 'teacherOptions'
  | 'groupOptions'
  | 'centerOptions'
  | 'saveError'
  | 'saving'
  | 'handleSaveLead'
  | 'handleCancelLead'
>;

export function VoiceLeadDetailModalFormBody({
  form,
  setForm,
  phoneError,
  setPhoneError,
  selectedTeacherId,
  levelOptions,
  teacherOptions,
  groupOptions,
  centerOptions,
  saveError,
  saving,
  handleSaveLead,
  handleCancelLead,
}: VoiceLeadDetailModalFormBodyProps) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');

  return (
    <div className="border-t border-slate-200 pt-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">{t('leadInformation')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('firstName')}</label>
          <input
            type="text"
            value={form.firstName ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('lastName')}</label>
          <input
            type="text"
            value={form.lastName ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('phoneNumber')}</label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
          onChange={(e) => {
            setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }));
            setPhoneError(null);
          }}
          className={`w-full rounded-lg border px-3 py-2 text-sm ${phoneError ? 'border-red-500' : 'border-slate-300'}`}
        />
        {phoneError ? <p className="mt-1 text-xs text-red-600">{phoneError}</p> : null}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('age')}</label>
        <input
          type="number"
          min={0}
          value={form.age ?? ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('level')}</label>
        <SingleSelectDropdown
          id="voice-lead-level"
          options={levelOptions}
          value={form.levelId ?? ''}
          onValueChange={(nextValue) => setForm((f) => ({ ...f, levelId: nextValue ?? '' }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacher')}</label>
        <SingleSelectDropdown
          id="voice-lead-teacher"
          options={teacherOptions}
          value={form.teacherId ?? ''}
          onValueChange={(nextValue) =>
            setForm((f) => ({ ...f, teacherId: nextValue ?? '', groupId: '' }))
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('group')}</label>
        <SingleSelectDropdown
          id="voice-lead-group"
          options={groupOptions}
          value={form.groupId ?? ''}
          onValueChange={(nextValue) => setForm((f) => ({ ...f, groupId: nextValue ?? '' }))}
          disabled={!selectedTeacherId}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('center')}</label>
        <SingleSelectDropdown
          id="voice-lead-center"
          options={centerOptions}
          value={form.centerId ?? ''}
          onValueChange={(nextValue) => setForm((f) => ({ ...f, centerId: nextValue ?? '' }))}
        />
      </div>
      {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSaveLead}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? t('saving') : tCommon('save')}
        </button>
        <button
          type="button"
          onClick={handleCancelLead}
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
        >
          {tCommon('cancel')}
        </button>
      </div>
    </div>
  );
}
