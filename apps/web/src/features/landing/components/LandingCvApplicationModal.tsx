'use client';

import { useCallback, useRef, useState } from 'react';
import { FileUp, Send, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { api } from '@/shared/lib/api';
import { ApiError } from '@/shared/lib/api-errors';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui';
import { BUTTON_HOVER_CLASS } from '../landingConstants';
import type { LandingTr } from '../types';

const CV_MAX_BYTES = 5 * 1024 * 1024;
const CV_MAX_FILES = 2;
const CV_ACCEPT = '.pdf,.doc,.docx';
const CV_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const FIELD_CLASS =
  'h-11 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-[14px] leading-[21px] tracking-[-0.31px] text-[#101828] placeholder:text-[#9ca3af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b3ba4]/25 focus-visible:ring-offset-0';

const LABEL_CLASS =
  'mb-1.5 block text-[13px] font-medium leading-[19px] tracking-[-0.15px] text-[#364153]';

type LandingCvApplicationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tr: LandingTr;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
};

function isAllowedCvFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isAllowedExtension = extension === 'pdf' || extension === 'doc' || extension === 'docx';
  const isAllowedMime = CV_MIME_TYPES.has(file.type) || file.type === '';
  return isAllowedExtension && isAllowedMime;
}

export function LandingCvApplicationModal({
  open,
  onOpenChange,
  tr,
}: LandingCvApplicationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [cvError, setCvError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setCvFiles([]);
    setCvError(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setIsSubmitted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      setSubmitError(null);
      event.target.value = '';

      if (selected.length === 0) {
        return;
      }

      const remainingSlots = CV_MAX_FILES - cvFiles.length;
      if (remainingSlots <= 0) {
        setCvError(tr('You can attach up to 2 files.', 'Կարող եք կցել մինչև 2 ֆայլ։'));
        return;
      }

      const nextFiles = [...cvFiles];
      let nextError: string | null = null;

      for (const file of selected.slice(0, remainingSlots)) {
        if (!isAllowedCvFile(file)) {
          nextError = tr(
            'Please upload a PDF, DOC, or DOCX file.',
            'Խնդրում ենք վերբեռնել PDF, DOC կամ DOCX ֆայլ։',
          );
          continue;
        }

        if (file.size > CV_MAX_BYTES) {
          nextError = tr('File must be 5 MB or smaller.', 'Ֆայլի չափը պետք է լինի 5 ՄԲ կամ ավելի փոքր։');
          continue;
        }

        const alreadyAdded = nextFiles.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        );
        if (!alreadyAdded) {
          nextFiles.push(file);
        }
      }

      setCvFiles(nextFiles);
      setCvError(nextError);
    },
    [cvFiles, tr],
  );

  const handleClearFile = useCallback((index: number) => {
    setCvFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setCvError(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitError(null);

      if (cvFiles.length === 0) {
        setCvError(tr('Please attach your CV.', 'Խնդրում ենք ավելացնել CV-ն։'));
        return;
      }

      const body = new FormData();
      body.append('firstName', form.firstName.trim());
      body.append('lastName', form.lastName.trim());
      body.append('email', form.email.trim());
      body.append('phone', form.phone.trim());
      if (form.message.trim()) {
        body.append('message', form.message.trim());
      }
      for (const file of cvFiles) {
        body.append('cv', file);
      }

      setIsSubmitting(true);
      try {
        await api.post<{ ok: true }>('/cv-applications', body, { skipAuthRefresh: true });
        setIsSubmitted(true);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : tr('Failed to send application. Please try again.', 'Չհաջողվեց ուղարկել դիմումը։ Փորձեք նորից։');
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [cvFiles, form, tr],
  );

  const canAddMoreFiles = cvFiles.length < CV_MAX_FILES;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        sheet={false}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[640px] gap-0 overflow-y-auto rounded-[16px] border-0 p-0 shadow-2xl"
        overlayClassName="bg-black/50"
        closeButtonClassName="flex size-8 items-center justify-center rounded-full text-[#6a7282] opacity-100 transition-colors hover:bg-[#1b3ba4] hover:text-white focus-visible:ring-2 focus-visible:ring-[#1b3ba4]/25"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="px-5 pb-5 pt-6 tablet:px-7 tablet:pb-6 tablet:pt-7">
          <DialogTitle className="text-[22px] font-bold leading-[30px] tracking-[-0.35px] text-[#1b3ba4] tablet:text-[24px] tablet:leading-[32px]">
            {tr('Apply for the Position', 'Դիմել հաստիքին')}
          </DialogTitle>

          {isSubmitted ? (
            <div className="mt-8 rounded-2xl bg-[#ecf0f7] px-5 py-6 text-center">
              <p className="text-[16px] font-medium leading-[24px] tracking-[-0.31px] text-[#101828]">
                {tr('Application received!', 'Դիմումը ստացվել է!')}
              </p>
              <p className="mt-2 text-[14px] leading-[21px] tracking-[-0.31px] text-[#4a5565]">
                {tr(
                  'Thank you for your interest. We will review your application and get back to you soon.',
                  'Շնորհակալություն հետաքրքրության համար։ Մենք կուսումնասիրենք ձեր դիմումը և շուտով կկապ հաստատենք ձեզ հետ։',
                )}
              </p>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className={cn(
                  'mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1b3ba4] px-8 text-[14px] font-medium leading-[21px] tracking-[-0.31px] text-white shadow-md',
                  BUTTON_HOVER_CLASS,
                )}
              >
                {tr('Close', 'Փակել')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS} htmlFor="cv-first-name">
                    {tr('First Name', 'Անուն')}
                  </label>
                  <input
                    id="cv-first-name"
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                    placeholder={tr('Enter your first name', 'Մուտքագրեք ձեր անունը')}
                    className={FIELD_CLASS}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="cv-last-name">
                    {tr('Last Name', 'Ազգանուն')}
                  </label>
                  <input
                    id="cv-last-name"
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                    placeholder={tr('Enter your last name', 'Մուտքագրեք ձեր ազգանունը')}
                    className={FIELD_CLASS}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS} htmlFor="cv-email">
                    {tr('Email', 'Էլ. հասցե')}
                  </label>
                  <input
                    id="cv-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder={tr('example@email.com', 'example@email.com')}
                    className={FIELD_CLASS}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS} htmlFor="cv-phone">
                    {tr('Phone', 'Հեռախոս')}
                  </label>
                  <input
                    id="cv-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder={tr('+374 XX XXX XXX', '+374 XX XXX XXX')}
                    className={FIELD_CLASS}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS} htmlFor="cv-message">
                  {tr('Cover Letter / Message', 'Ուղեկցող նամակ / հաղորդագրություն')}
                </label>
                <textarea
                  id="cv-message"
                  rows={2}
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder={tr(
                    'Tell us briefly about yourself and why you are a good fit…',
                    'Կարճ պատմեք ձեր մասին և ինչու եք համապատասխանում…',
                  )}
                  className={cn(FIELD_CLASS, 'min-h-[72px] resize-none py-2.5')}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <p className={LABEL_CLASS}>{tr('CV / Resume', 'CV / ռեզյումե')}</p>
                <p className="mb-2 text-[12px] leading-[18px] tracking-[-0.15px] text-[#6a7282]">
                  {tr(
                    'PDF, DOC or DOCX, up to 5 MB each · max 2 files',
                    'PDF, DOC կամ DOCX, յուրաքանչյուրը մինչև 5 ՄԲ · մինչև 2 ֆայլ',
                  )}
                </p>

                <div className="space-y-2">
                  {cvFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-xl border border-dashed border-[#d1d5dc] bg-[#fafafa] px-4 py-3',
                        isSubmitting && 'opacity-60',
                      )}
                    >
                      <FileUp className="size-6 shrink-0 text-[#fb2c36]" strokeWidth={2} />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-[19px] tracking-[-0.15px] text-[#364153]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleClearFile(index)}
                        disabled={isSubmitting}
                        aria-label={tr('Remove file', 'Ջնջել ֆայլը')}
                        className={cn(
                          'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#6a7282] transition-colors hover:bg-[#e5e7eb] hover:text-[#101828]',
                          isSubmitting && 'cursor-not-allowed',
                        )}
                      >
                        <X className="size-4" strokeWidth={2.25} />
                      </button>
                    </div>
                  ))}

                  {canAddMoreFiles ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                      className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d1d5dc] bg-[#fafafa] px-4 py-3 transition-colors hover:border-[#1b3ba4]/40 hover:bg-[#f3f6fc]',
                        isSubmitting && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      <FileUp className="size-6 shrink-0 text-[#fb2c36]" strokeWidth={2} />
                      <span className="truncate text-[13px] font-medium leading-[19px] tracking-[-0.15px] text-[#364153]">
                        {cvFiles.length === 0
                          ? tr('Choose file', 'Ընտրել ֆայլ')
                          : tr('Add another file', 'Ավելացնել ևս մեկ ֆայլ')}
                      </span>
                    </button>
                  ) : null}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={CV_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isSubmitting || !canAddMoreFiles}
                />
                {cvError ? (
                  <p className="mt-2 text-[13px] leading-[19px] text-[#e7000b]">{cvError}</p>
                ) : null}
              </div>

              {submitError ? (
                <p className="text-[13px] leading-[19px] text-[#e7000b]">{submitError}</p>
              ) : null}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1b3ba4] px-5 text-[14px] font-medium leading-[21px] tracking-[-0.31px] text-white shadow-md',
                    BUTTON_HOVER_CLASS,
                    isSubmitting && 'cursor-not-allowed opacity-70',
                  )}
                >
                  <span>
                    {isSubmitting
                      ? tr('Sending…', 'Ուղարկվում է…')
                      : tr('Send Application', 'Ուղարկել դիմումը')}
                  </span>
                  <Send className="size-4" strokeWidth={2.25} />
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
