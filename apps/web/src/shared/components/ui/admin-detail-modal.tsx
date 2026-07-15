'use client';

import { useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { portalCardClass } from '@/shared/lib/portal-theme';
import { CUSTOM_DESKTOP_SIDE_PANEL_CLASS } from '@/shared/lib/portal-form-sheet-classes';
import {
  portalSheetLayerProps,
  stackedSheetOverlayClassName,
  useSheetStackZIndex,
} from '@/shared/lib/sheet-stack';

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

  const { overlayStyle, contentStyle, isBaseLayer } = useSheetStackZIndex(open);

  if (!open) return null;

  return (
    <div
      className={stackedSheetOverlayClassName(
        'fixed inset-0 bg-black/50 tablet:bg-black/60',
        isBaseLayer,
      )}
      style={overlayStyle}
      {...portalSheetLayerProps}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          portalCardClass,
          'fixed inset-x-0 bottom-0 flex max-h-[92vh] w-full flex-col rounded-t-3xl shadow-2xl sm:max-h-[92vh]',
          'tablet:bottom-auto tablet:top-auto',
          CUSTOM_DESKTOP_SIDE_PANEL_CLASS,
          'p-0',
        )}
        style={contentStyle}
        {...portalSheetLayerProps}
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
