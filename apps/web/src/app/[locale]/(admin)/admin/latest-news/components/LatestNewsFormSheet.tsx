'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { ADMIN_ICON_BUTTON_SM_CLASS } from '@/shared/lib/admin-control-theme';
import {
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { cn } from '@/shared/lib/utils';
import type { LatestNewsFormState } from '../../settings/components/latestNewsForm.utils';
import {
  latestNewsInputClassName,
  latestNewsTextareaClassName,
} from '../../settings/components/latestNewsForm.utils';
import { LatestNewsImageField } from './LatestNewsImageField';

type LatestNewsFormSheetProps = {
  open: boolean;
  editingId: string | null;
  form: LatestNewsFormState;
  imageFile: File | null;
  currentImageUrl: string | null;
  isPending: boolean;
  errorMessage: string | null;
  labels: {
    createTitle: string;
    editTitle: string;
    titleEn: string;
    titleHy: string;
    titleEnPlaceholder: string;
    titleHyPlaceholder: string;
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
    createAction: string;
    saveAction: string;
    saving: string;
  };
  fileInputRef: RefObject<HTMLInputElement | null>;
  onChange: (next: LatestNewsFormState) => void;
  onFileSelect: (file: File) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
};

export function LatestNewsFormSheet({
  open,
  editingId,
  form,
  imageFile,
  currentImageUrl,
  isPending,
  errorMessage,
  labels,
  fileInputRef,
  onChange,
  onFileSelect,
  onOpenChange,
  onSave,
}: LatestNewsFormSheetProps) {
  const tCommon = useTranslations('common');
  const isEditing = Boolean(editingId);
  const title = isEditing ? labels.editTitle : labels.createTitle;
  const submitLabel = isEditing ? labels.saveAction : labels.createAction;

  const requestClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    onClose: requestClose,
    enabled: open,
  });

  useEffect(() => {
    if (!open) resetDrag();
  }, [open, resetDrag]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal
        open={open}
        dragStyle={dragStyle}
        sheetContentRef={scrollContentProps.ref}
        contentClassName={portalFormSheetContentClass('2xl')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

        <div className={PORTAL_FORM_SHEET_HEADER_CLASS}>
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="min-w-0 flex-1 text-lg font-semibold text-[#3b3b40]">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className={cn(
                ADMIN_ICON_BUTTON_SM_CLASS,
                'hidden text-slate-500 hover:bg-slate-100 hover:text-slate-700 tablet:inline-flex',
              )}
              aria-label={tCommon('close')}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        <PortalFormSheetScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 pb-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
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

              <div className="mt-5 space-y-4 border-t border-[rgba(14,14,16,0.06)] pt-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                    {labels.titleEn}
                  </label>
                  <input
                    value={form.titleEn}
                    onChange={(e) => onChange({ ...form, titleEn: e.target.value })}
                    className={latestNewsInputClassName}
                    placeholder={labels.titleEnPlaceholder}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                    {labels.bodyEn}
                  </label>
                  <textarea
                    rows={4}
                    value={form.bodyEn}
                    onChange={(e) => onChange({ ...form, bodyEn: e.target.value })}
                    className={latestNewsTextareaClassName}
                    placeholder={labels.bodyHint}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                    {labels.titleHy}
                  </label>
                  <input
                    value={form.titleHy}
                    onChange={(e) => onChange({ ...form, titleHy: e.target.value })}
                    className={latestNewsInputClassName}
                    placeholder={labels.titleHyPlaceholder}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                    {labels.bodyHy}
                  </label>
                  <textarea
                    rows={4}
                    value={form.bodyHy}
                    onChange={(e) => onChange({ ...form, bodyHy: e.target.value })}
                    className={latestNewsTextareaClassName}
                    placeholder={labels.bodyHint}
                  />
                </div>

                <div className="grid gap-4 tablet:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3b3b40]">
                      {labels.publishedAt}
                    </label>
                    <input
                      type="date"
                      value={form.publishedAt}
                      onChange={(e) => onChange({ ...form, publishedAt: e.target.value })}
                      className={latestNewsInputClassName}
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-[#f7f8fc] px-4">
                      <span className="text-sm font-medium text-[#3b3b40]">{labels.published}</span>
                      <span
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
                          form.isPublished ? 'bg-[#1010a3]' : 'bg-slate-300',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={form.isPublished}
                          onChange={(e) => onChange({ ...form, isPublished: e.target.checked })}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute top-[2px] left-[2px] size-4 rounded-full border border-slate-300 bg-white shadow-sm transition-transform duration-200',
                            form.isPublished && 'translate-x-4',
                          )}
                        />
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            ) : null}

            <div className="sticky bottom-0 -mx-1 bg-gradient-to-t from-[#f8f9fb] via-[#f8f9fb] to-transparent pt-4">
              <Button
                type="button"
                size="lg"
                className="h-11 min-h-11 w-full rounded-[15px] bg-[#1010a3] px-8 py-0 text-white hover:bg-[#1010a3]/90"
                onClick={onSave}
                disabled={isPending}
              >
                {isPending ? labels.saving : submitLabel}
              </Button>
            </div>
          </div>
        </PortalFormSheetScrollArea>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
