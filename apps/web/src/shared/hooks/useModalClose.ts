'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, RefObject } from 'react';

interface UseModalCloseOptions {
  open: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  containerRef?: RefObject<HTMLElement | null>;
  /**
   * Nodes that are rendered outside `containerRef` (e.g. portaled dropdowns) but should still count as
   * "inside" the modal for outside-click / pointer-down close behavior.
   */
  additionalInsideRefs?: ReadonlyArray<RefObject<HTMLElement | null>>;
}

interface UseModalCloseResult {
  onOverlayMouseDown: (event: MouseEvent<HTMLElement>) => void;
  onOverlayClick: (event: MouseEvent<HTMLElement>) => void;
}

export function useModalClose({
  open,
  onClose,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  containerRef,
  additionalInsideRefs,
}: UseModalCloseOptions): UseModalCloseResult {
  const shouldCloseFromOverlayRef = useRef(false);

  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, onClose, open]);

  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;

    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef?.current;
      if (!container) return;
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (container.contains(targetNode)) return;
      const insideExtra = additionalInsideRefs?.some((ref) => ref.current?.contains(targetNode));
      if (insideExtra) return;
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [additionalInsideRefs, closeOnOutsideClick, containerRef, onClose, open]);

  const onOverlayMouseDown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!closeOnOutsideClick) return;
      shouldCloseFromOverlayRef.current = event.target === event.currentTarget;
    },
    [closeOnOutsideClick],
  );

  const onOverlayClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!closeOnOutsideClick) return;
      if (shouldCloseFromOverlayRef.current && event.target === event.currentTarget) {
        onClose();
      }
      shouldCloseFromOverlayRef.current = false;
    },
    [closeOnOutsideClick, onClose],
  );

  return {
    onOverlayMouseDown,
    onOverlayClick,
  };
}
