'use client';

import { useTranslations } from 'next-intl';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import type { LeadDrawerViewModel } from './lead-drawer.types';

export function LeadDrawerFormBody({
  form,
  setForm,
  selectedTeacherId,
  levelOptions,
  centerOptions,
  teacherOptions,
  groupOptions,
  comment,
  setComment,
  submittingComment,
  patchAndSave,
  handleSaveFields,
  handleAddComment,
}: LeadDrawerViewModel) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('firstName')}</label>
          <input
            type="text"
            value={form.firstName ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            onBlur={handleSaveFields}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('lastName')}</label>
          <input
            type="text"
            value={form.lastName ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            onBlur={handleSaveFields}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{tc('phone')}</label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={form.phone != null && form.phone !== '' ? `+${form.phone}` : '+'}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
          onBlur={handleSaveFields}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('age')}</label>
          <input
            type="number"
            min={0}
            value={form.age ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))
            }
            onBlur={handleSaveFields}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('level')}</label>
          <SingleSelectDropdown
            id="lead-drawer-level"
            options={levelOptions}
            value={form.levelId ?? ''}
            onValueChange={(nextValue) => {
              void patchAndSave({ levelId: nextValue ?? '' });
            }}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('center')}</label>
        <SingleSelectDropdown
          id="lead-drawer-center"
          options={centerOptions}
          value={form.centerId ?? ''}
          onValueChange={(nextValue) => {
            void patchAndSave({ centerId: nextValue ?? '' });
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('teacher')}</label>
        <SingleSelectDropdown
          id="lead-drawer-teacher"
          options={teacherOptions}
          value={form.teacherId ?? ''}
          onValueChange={(nextValue) => {
            void patchAndSave({ teacherId: nextValue ?? '', groupId: '' });
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('group')}</label>
        <SingleSelectDropdown
          id="lead-drawer-group"
          options={groupOptions}
          value={form.groupId ?? ''}
          onValueChange={(nextValue) => {
            void patchAndSave({ groupId: nextValue ?? '' });
          }}
          disabled={!selectedTeacherId}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{tc('notes')}</label>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          onBlur={handleSaveFields}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <form onSubmit={handleAddComment} className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">{t('addComment')}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('writeCommentPlaceholder')}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submittingComment || !comment.trim()}
          className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300 disabled:opacity-50"
        >
          {submittingComment ? t('sending') : t('send')}
        </button>
      </form>
    </>
  );
}
