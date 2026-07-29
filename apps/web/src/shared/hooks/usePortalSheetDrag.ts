'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { PORTAL_SIDE_SHEET_MIN_WIDTH } from '@/shared/lib/role-routes';

type UsePortalSheetDragOptions = {
  onClose: () => void;
  enabled?: boolean;
};

const SCROLL_TOP_THRESHOLD = 1;
const DRAG_COMMIT_THRESHOLD = 6;
const DRAG_CLOSE_THRESHOLD = 110;
const MAX_DRAG_OFFSET = 340;

export const PORTAL_SHEET_DRAG_HANDLE_ATTR = 'data-portal-sheet-drag-handle';

type DragSource = 'handle' | 'scroll' | null;

export type PortalSheetDragHandleProps = {
  ref: (node: HTMLDivElement | null) => void;
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchCancel: (event: TouchEvent<HTMLDivElement>) => void;
};

/** Attach ref to the sheet container (`DialogPrimitive.Content`), not the inner scroll div. */
export type PortalSheetScrollContentProps = {
  ref: (node: HTMLDivElement | null) => void;
};

type UsePortalSheetDragResult = {
  dragStyle: { transform: string; transition: string } | undefined;
  dragHandleProps: PortalSheetDragHandleProps;
  scrollContentProps: PortalSheetScrollContentProps;
  resetDrag: () => void;
};

function isMobileSheetViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia(`(min-width: ${PORTAL_SIDE_SHEET_MIN_WIDTH}px)`).matches;
}

function isScrollableElement(element: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(element);
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false;
  }
  return element.scrollHeight > element.clientHeight + SCROLL_TOP_THRESHOLD;
}

function getSheetScrollables(sheetRoot: HTMLElement): HTMLElement[] {
  const scrollables: HTMLElement[] = [];
  if (isScrollableElement(sheetRoot)) {
    scrollables.push(sheetRoot);
  }
  sheetRoot.querySelectorAll('*').forEach((node) => {
    if (node instanceof HTMLElement && isScrollableElement(node)) {
      scrollables.push(node);
    }
  });
  return scrollables;
}

function areAllSheetScrollablesAtTop(sheetRoot: HTMLElement): boolean {
  const scrollables = getSheetScrollables(sheetRoot);
  if (scrollables.length === 0) return true;
  return scrollables.every((element) => element.scrollTop <= SCROLL_TOP_THRESHOLD);
}

function isDragHandleTouch(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(`[${PORTAL_SHEET_DRAG_HANDLE_ATTR}]`) !== null;
}

export function usePortalSheetDrag({
  onClose,
  enabled = true,
}: UsePortalSheetDragOptions): UsePortalSheetDragResult {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [sheetRootNode, setSheetRootNode] = useState<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const dragSourceRef = useRef<DragSource>(null);
  const isSheetDragCommittedRef = useRef(false);
  const dragOffsetYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    dragOffsetYRef.current = dragOffsetY;
  }, [dragOffsetY]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const resetDragRefs = useCallback(() => {
    touchStartYRef.current = null;
    touchStartXRef.current = null;
    dragSourceRef.current = null;
    isSheetDragCommittedRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const resetDrag = useCallback(() => {
    resetDragRefs();
    dragOffsetYRef.current = 0;
    setDragOffsetY(0);
    setIsSettling(false);
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, [resetDragRefs]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
      }
    };
  }, []);

  const beginPointerTracking = useCallback((clientY: number, clientX: number) => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    touchStartYRef.current = clientY;
    touchStartXRef.current = clientX;
    setIsSettling(false);
  }, []);

  const handleDragStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!enabled || !isMobileSheetViewport()) return;
      const firstTouch = event.touches[0];
      if (!firstTouch) return;
      dragSourceRef.current = 'handle';
      isSheetDragCommittedRef.current = true;
      beginPointerTracking(firstTouch.clientY, firstTouch.clientX);
      isDraggingRef.current = true;
      setIsDragging(true);
    },
    [beginPointerTracking, enabled],
  );

  const applyDragMove = useCallback(
    (event: TouchEvent<HTMLDivElement> | globalThis.TouchEvent, sheetRoot?: HTMLElement) => {
      if (!enabled || !isMobileSheetViewport()) return;
      if (dragSourceRef.current === null) return;
      if (touchStartYRef.current === null || touchStartXRef.current === null) return;

      const firstTouch = event.touches[0];
      if (!firstTouch) return;

      const deltaY = firstTouch.clientY - touchStartYRef.current;
      const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);

      if (dragSourceRef.current === 'scroll' && !isSheetDragCommittedRef.current) {
        if (sheetRoot && !areAllSheetScrollablesAtTop(sheetRoot)) {
          resetDragRefs();
          return;
        }
        if (Math.abs(deltaY) < DRAG_COMMIT_THRESHOLD && deltaX < DRAG_COMMIT_THRESHOLD) {
          return;
        }
        if (deltaY > 0 && deltaY > deltaX) {
          isSheetDragCommittedRef.current = true;
          isDraggingRef.current = true;
          setIsDragging(true);
        } else {
          resetDragRefs();
          return;
        }
      }

      if (!isDraggingRef.current && !isSheetDragCommittedRef.current) return;
      if (deltaY <= 0 || deltaY <= deltaX) return;

      // React touch listeners are passive; only native `{ passive: false }` can cancel.
      if (event.cancelable) {
        event.preventDefault();
      }
      const nextOffset = Math.min(deltaY * 0.95, MAX_DRAG_OFFSET);
      dragOffsetYRef.current = nextOffset;
      setDragOffsetY(nextOffset);
    },
    [enabled, resetDragRefs],
  );

  const finishDrag = useCallback(() => {
    if (!enabled || !isMobileSheetViewport()) return;
    if (dragSourceRef.current === 'scroll' && !isSheetDragCommittedRef.current) {
      resetDragRefs();
      return;
    }
    if (!isDraggingRef.current) return;

    const shouldClose = dragOffsetYRef.current > DRAG_CLOSE_THRESHOLD;
    resetDragRefs();
    if (shouldClose) {
      dragOffsetYRef.current = 0;
      setDragOffsetY(0);
      onCloseRef.current();
      return;
    }
    setIsSettling(true);
    dragOffsetYRef.current = 0;
    setDragOffsetY(0);
    settleTimerRef.current = setTimeout(() => {
      setIsSettling(false);
      settleTimerRef.current = null;
    }, 280);
  }, [enabled, resetDragRefs]);

  const handleDragEnd = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  const [handleNode, setHandleNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleEl = handleNode;
    if (!handleEl || !enabled) return;

    const onTouchMove = (event: globalThis.TouchEvent) => {
      if (dragSourceRef.current !== 'handle') return;
      applyDragMove(event);
    };

    handleEl.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      handleEl.removeEventListener('touchmove', onTouchMove);
    };
  }, [applyDragMove, enabled, handleNode]);

  useEffect(() => {
    const sheetRoot = sheetRootNode;
    if (!sheetRoot || !enabled) return;

    const onTouchStart = (event: globalThis.TouchEvent) => {
      if (!isMobileSheetViewport()) return;
      const target = event.target;
      if (!(target instanceof Element) || !sheetRoot.contains(target)) return;
      if (isDragHandleTouch(target)) return;
      if (!areAllSheetScrollablesAtTop(sheetRoot)) return;

      const firstTouch = event.touches[0];
      if (!firstTouch) return;

      dragSourceRef.current = 'scroll';
      isSheetDragCommittedRef.current = false;
      beginPointerTracking(firstTouch.clientY, firstTouch.clientX);
    };

    const onTouchMove = (event: globalThis.TouchEvent) => {
      if (dragSourceRef.current !== 'scroll') return;
      applyDragMove(event, sheetRoot);
    };

    const onTouchEnd = () => {
      if (dragSourceRef.current !== 'scroll') return;
      finishDrag();
    };

    sheetRoot.addEventListener('touchstart', onTouchStart, { capture: true });
    sheetRoot.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
    sheetRoot.addEventListener('touchend', onTouchEnd, { capture: true });
    sheetRoot.addEventListener('touchcancel', onTouchEnd, { capture: true });

    return () => {
      sheetRoot.removeEventListener('touchstart', onTouchStart, { capture: true });
      sheetRoot.removeEventListener('touchmove', onTouchMove, { capture: true });
      sheetRoot.removeEventListener('touchend', onTouchEnd, { capture: true });
      sheetRoot.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, [applyDragMove, beginPointerTracking, enabled, finishDrag, sheetRootNode]);

  const setSheetRootRef = useCallback((node: HTMLDivElement | null) => {
    setSheetRootNode((prev) => (prev === node ? prev : node));
  }, []);

  const setHandleRef = useCallback((node: HTMLDivElement | null) => {
    setHandleNode((prev) => (prev === node ? prev : node));
  }, []);

  const dragStyle = useMemo(
    () =>
      dragOffsetY > 0 || isSettling
        ? {
            transform: `translateY(${dragOffsetY}px)`,
            transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          }
        : undefined,
    [dragOffsetY, isDragging, isSettling],
  );

  const dragHandleProps = useMemo(
    () => ({
      ref: setHandleRef,
      onTouchStart: handleDragStart,
      onTouchEnd: handleDragEnd,
      onTouchCancel: handleDragEnd,
    }),
    [handleDragEnd, handleDragStart, setHandleRef],
  );

  const scrollContentProps = useMemo(
    () => ({
      ref: setSheetRootRef,
    }),
    [setSheetRootRef],
  );

  return {
    dragStyle,
    dragHandleProps,
    scrollContentProps,
    resetDrag,
  };
}
