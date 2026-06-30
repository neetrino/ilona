'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { GlobalSearchBar } from './GlobalSearchBar';
import { cn } from '@/shared/lib/utils';

const SEARCH_INPUT_CLASS =
  'h-11 rounded-[2.125rem] border-transparent bg-[#f3f3f4]';

type PortalMobileSearchSheetProps = {
  open: boolean;
  onClose: () => void;
  backdropClassName?: string;
  containerClassName?: string;
};

export function PortalMobileSearchSheet({
  open,
  onClose,
  backdropClassName,
  containerClassName,
}: PortalMobileSearchSheetProps) {
  const t = useTranslations('common');
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    onClose,
    enabled: isMounted && isVisible,
  });

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    resetDrag();
    const timeout = window.setTimeout(() => setIsMounted(false), 360);
    return () => window.clearTimeout(timeout);
  }, [open, resetDrag]);

  useEffect(() => {
    if (!isMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-[70] bg-black/45 transition-opacity duration-300 ease-out lg:hidden',
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          backdropClassName,
        )}
        aria-label={t('close')}
        onClick={onClose}
      />

      <div
        ref={scrollContentProps.ref}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[80] lg:hidden',
          dragStyle ? 'transition-none' : 'transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isVisible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
          containerClassName,
        )}
        style={dragStyle}
      >
        <div className="flex h-[72vh] min-h-[26rem] max-h-[80vh] flex-col rounded-t-[1.5rem] border border-b-0 border-[rgba(14,14,16,0.07)] bg-white shadow-[0_-12px_36px_rgba(0,0,0,0.16)]">
          <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

          <div className="flex-1 overflow-visible px-4 pt-6 pb-3">
            <GlobalSearchBar
              key="portal-mobile-search"
              className="w-full max-w-none"
              inputClassName={SEARCH_INPUT_CLASS}
              autoFocus
              dropdownPlacement="below"
              onNavigate={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
}
