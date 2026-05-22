'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { portalCardClass } from '@/shared/lib/portal-theme';

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-3 md:p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          portalCardClass,
          'flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-3xl shadow-2xl sm:rounded-3xl',
          'p-0',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[rgba(14,14,16,0.07)] px-5 py-4 sm:px-7 sm:py-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1010a3] sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[0.875rem] p-1.5 text-[#8b8b90] transition-colors hover:bg-[#f6f6f7] hover:text-[#3b3b40]"
            aria-label={closeAriaLabel}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:space-y-8 sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
