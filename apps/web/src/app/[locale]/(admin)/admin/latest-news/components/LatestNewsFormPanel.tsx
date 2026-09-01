'use client';

import type { RefObject } from 'react';
import type { LatestNewsFormState } from '../../settings/components/latestNewsForm.utils';
import {
  latestNewsInputClassName,
  latestNewsTextareaClassName,
} from '../../settings/components/latestNewsForm.utils';
import { Button } from '@/shared/components/ui';
import { LatestNewsImageField } from './LatestNewsImageField';
import { cn } from '@/shared/lib/utils';

type LatestNewsFormPanelProps = {
  editingId: string | null;
  form: LatestNewsFormState;
  imageFile: File | null;
  currentImageUrl: string | null;
  isPending: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  labels: {
    createTitle: string;
    editTitle: string;
    cancelEdit: string;
    titleEn: string;
    titleHy: string;
    bodyEn: string;
    bodyHy: string;
    bodyHint: string;
    publishedAt: string;
    published: string;
    image: string;
    formats: string;
    chooseImage: string;
    changeImage: string;
    keepCurrentImage: string;
    save: string;
    saving: string;
  };
  fileInputRef: RefObject<HTMLInputElement | null>;
  formSectionRef: RefObject<HTMLDivElement | null>;
  onChange: (next: LatestNewsFormState) => void;
  onFileSelect: (file: File) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function LatestNewsFormPanel({
  editingId,
  form,
  imageFile,
  currentImageUrl,
  isPending,
  errorMessage,
  successMessage,
  labels,
  fileInputRef,
  formSectionRef,
  onChange,
  onFileSelect,
  onCancel,
  onSave,
}: LatestNewsFormPanelProps) {
  return (
    <section
      ref={formSectionRef}
      className="overflow-hidden rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white shadow-[0_12px_40px_rgba(16,16,163,0.04)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(14,14,16,0.06)] bg-gradient-to-r from-[#f5f6ff] via-white to-[#f8fafc] px-6 py-5 tablet:px-8">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold',
              editingId
                ? 'bg-[#1010a3]/10 text-[#1010a3]'
                : 'bg-emerald-50 text-emerald-700',
            )}
          >
            {editingId ? labels.editTitle : labels.createTitle}
          </span>
        </div>
        {editingId ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            {labels.cancelEdit}
          </Button>
        ) : null}
      </div>

      <div className="space-y-6 p-6 tablet:p-8">
        <div className="grid gap-4 tablet:grid-cols-2">
          <div className="rounded-2xl bg-[#f7f8fc] p-4">
            <label className="mb-2 block text-sm font-medium text-[#3b3b40]">{labels.titleEn}</label>
            <input
              value={form.titleEn}
              onChange={(e) => onChange({ ...form, titleEn: e.target.value })}
              className={latestNewsInputClassName}
            />
            <label className="mb-2 mt-4 block text-sm font-medium text-[#3b3b40]">{labels.bodyEn}</label>
            <textarea
              rows={6}
              value={form.bodyEn}
              onChange={(e) => onChange({ ...form, bodyEn: e.target.value })}
              className={latestNewsTextareaClassName}
              placeholder={labels.bodyHint}
            />
          </div>

          <div className="rounded-2xl bg-[#f7f8fc] p-4">
            <label className="mb-2 block text-sm font-medium text-[#3b3b40]">{labels.titleHy}</label>
            <input
              value={form.titleHy}
              onChange={(e) => onChange({ ...form, titleHy: e.target.value })}
              className={latestNewsInputClassName}
            />
            <label className="mb-2 mt-4 block text-sm font-medium text-[#3b3b40]">{labels.bodyHy}</label>
            <textarea
              rows={6}
              value={form.bodyHy}
              onChange={(e) => onChange({ ...form, bodyHy: e.target.value })}
              className={latestNewsTextareaClassName}
              placeholder={labels.bodyHint}
            />
          </div>
        </div>

        <div className="grid gap-4 tablet:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#3b3b40]">{labels.publishedAt}</label>
            <input
              type="date"
              value={form.publishedAt}
              onChange={(e) => onChange({ ...form, publishedAt: e.target.value })}
              className={latestNewsInputClassName}
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 self-end rounded-2xl border border-[rgba(14,14,16,0.07)] bg-[#f7f8fc] px-4 py-3">
            <span className="text-sm font-medium text-[#3b3b40]">{labels.published}</span>
            <span className="relative inline-flex h-6 w-11 shrink-0">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => onChange({ ...form, isPublished: e.target.checked })}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-[#f1f1f2] transition-colors peer-checked:bg-[#1010a3] peer-focus-visible:ring-4 peer-focus-visible:ring-[#1010a3]/20 after:absolute after:start-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white" />
            </span>
          </label>
        </div>

        <LatestNewsImageField
          label={labels.image}
          formatsHint={labels.formats}
          chooseLabel={labels.chooseImage}
          changeLabel={labels.changeImage}
          keepCurrentLabel={labels.keepCurrentImage}
          fileName={imageFile?.name ?? null}
          currentImageUrl={currentImageUrl}
          imageFile={imageFile}
          disabled={isPending}
          onFileSelect={onFileSelect}
          fileInputRef={fileInputRef}
        />

        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="flex justify-end border-t border-[rgba(14,14,16,0.06)] pt-5">
          <Button
            type="button"
            size="lg"
            className="h-11 min-h-11 rounded-[15px] bg-[#1010a3] px-8 py-0 text-white hover:bg-[#1010a3]/90"
            onClick={onSave}
            disabled={isPending}
          >
            {isPending ? labels.saving : labels.save}
          </Button>
        </div>
      </div>
    </section>
  );
}
