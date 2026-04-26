'use client';

import { useEffect, type ReactNode } from 'react';

export interface AdminDetailModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Dialog accessible name (falls back to plain text if title is a string). */
  'aria-label'?: string;
  closeAriaLabel?: string;
  /** Return true if Escape was handled (e.g. nested lightbox); main modal will not close. */
  onEscapeKey?: () => boolean;
}

export function AdminDetailModal({
  open,
  onClose,
  title,
  children,
  'aria-label': ariaLabel,
  closeAriaLabel = 'Close',
  onEscapeKey,
}: AdminDetailModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (onEscapeKey?.()) return;
      if (open) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose, onEscapeKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label={closeAriaLabel}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-8">{children}</div>
      </div>
    </div>
  );
}
