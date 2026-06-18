'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const DRAG_CLOSE_THRESHOLD = 96;
  const t = useTranslations('common');
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setDragOffsetY(0);
      setIsDragging(false);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    setDragOffsetY(0);
    setIsDragging(false);
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

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const target = event.target;
    const isHandleTouch =
      target instanceof Element && target.closest('[data-drag-handle="true"]') !== null;
    if (!isHandleTouch) {
      touchStartY.current = null;
      touchCurrentY.current = null;
      setIsDragging(false);
      return;
    }

    const touchY = event.touches[0]?.clientY ?? null;
    if (touchY === null) return;

    touchStartY.current = touchY;
    touchCurrentY.current = touchY;
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || touchStartY.current === null) return;
    touchCurrentY.current = event.touches[0]?.clientY ?? null;
    const delta = (touchCurrentY.current ?? touchStartY.current) - touchStartY.current;
    const nextOffset = Math.max(0, delta);
    setDragOffsetY(nextOffset);
    if (nextOffset > 0) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && dragOffsetY > DRAG_CLOSE_THRESHOLD) {
      onClose();
    } else {
      setDragOffsetY(0);
    }
    setIsDragging(false);
    touchStartY.current = null;
    touchCurrentY.current = null;
  };

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
        className={cn(
          'fixed inset-x-0 bottom-0 z-[80] lg:hidden',
          isDragging
            ? 'transition-none'
            : 'transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isVisible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
          containerClassName,
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={isVisible ? { transform: `translateY(${dragOffsetY}px)` } : undefined}
      >
        <div className="flex h-[72vh] min-h-[26rem] max-h-[80vh] flex-col rounded-t-[1.5rem] border border-b-0 border-[rgba(14,14,16,0.07)] bg-white shadow-[0_-12px_36px_rgba(0,0,0,0.16)]">
          <div className="flex justify-center pt-3" data-drag-handle="true">
            <span className="h-1.5 w-12 rounded-full bg-[#d8d8de]" aria-hidden />
          </div>

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
