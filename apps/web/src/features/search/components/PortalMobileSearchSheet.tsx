'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GlobalSearchBar } from './GlobalSearchBar';
import { cn } from '@/shared/lib/utils';

const SEARCH_INPUT_CLASS =
  'h-11 rounded-[2.125rem] border-transparent bg-[#f3f3f4]';

type PortalMobileSearchSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function PortalMobileSearchSheet({
  open,
  onClose,
}: PortalMobileSearchSheetProps) {
  const t = useTranslations('common');
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setIsMounted(false), 360);
    return () => window.clearTimeout(timeout);
  }, [open]);

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
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
        aria-label={t('close')}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[80] transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden',
          isVisible ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex h-[72vh] min-h-[26rem] max-h-[80vh] flex-col rounded-t-[1.5rem] border border-b-0 border-[rgba(14,14,16,0.07)] bg-white shadow-[0_-12px_36px_rgba(0,0,0,0.16)]">
          <div className="flex items-center justify-between border-b border-[rgba(14,14,16,0.07)] px-4 py-3">
            <h2 className="text-base font-semibold text-[#3b3b40]">{t('globalSearch')}</h2>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5b5b62] hover:bg-[#f3f3f4]"
              aria-label={t('close')}
              onClick={onClose}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
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
