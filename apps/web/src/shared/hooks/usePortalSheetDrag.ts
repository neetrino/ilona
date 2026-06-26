'use client';

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { PORTAL_DESKTOP_MIN_WIDTH } from '@/shared/lib/role-routes';

type UsePortalSheetDragOptions = {
  onClose: () => void;
  enabled?: boolean;
};

type PortalSheetDragHandleProps = {
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchCancel: (event: TouchEvent<HTMLDivElement>) => void;
};

type UsePortalSheetDragResult = {
  dragStyle: { transform: string; transition: string } | undefined;
  dragHandleProps: PortalSheetDragHandleProps;
  resetDrag: () => void;
};

function isMobileSheetViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(`(min-width: ${PORTAL_DESKTOP_MIN_WIDTH}px)`).matches;
}

export function usePortalSheetDrag({
  onClose,
  enabled = true,
}: UsePortalSheetDragOptions): UsePortalSheetDragResult {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetDrag = useCallback(() => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setDragOffsetY(0);
    setIsDragging(false);
    setIsSettling(false);
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const resetDragRefs = useCallback(() => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    setIsDragging(false);
  }, []);

  const handleDragStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!enabled || !isMobileSheetViewport()) return;
      const firstTouch = event.touches[0];
      if (!firstTouch) return;
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      touchStartYRef.current = firstTouch.clientY;
      touchStartXRef.current = firstTouch.clientX;
      setIsSettling(false);
      setIsDragging(true);
    },
    [enabled],
  );

  const handleDragMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!enabled || !isMobileSheetViewport()) return;
      if (!isDragging || touchStartYRef.current === null || touchStartXRef.current === null) return;
      const firstTouch = event.touches[0];
      if (!firstTouch) return;
      const deltaY = firstTouch.clientY - touchStartYRef.current;
      const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
      if (deltaY <= 0 || deltaY <= deltaX) return;
      event.preventDefault();
      setDragOffsetY(Math.min(deltaY * 0.95, 340));
    },
    [enabled, isDragging],
  );

  const handleDragEnd = useCallback(() => {
    if (!enabled || !isMobileSheetViewport()) return;
    if (!isDragging) return;
    const shouldClose = dragOffsetY > 110;
    resetDragRefs();
    if (shouldClose) {
      setDragOffsetY(0);
      onClose();
      return;
    }
    setIsSettling(true);
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  }, [dragOffsetY, enabled, isDragging, onClose, resetDragRefs]);

  const dragStyle =
    dragOffsetY > 0 || isSettling
      ? {
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }
      : undefined;

  return {
    dragStyle,
    dragHandleProps: {
      onTouchStart: handleDragStart,
      onTouchMove: handleDragMove,
      onTouchEnd: handleDragEnd,
      onTouchCancel: handleDragEnd,
    },
    resetDrag,
  };
}
