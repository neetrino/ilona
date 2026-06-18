import { RefObject, useEffect } from 'react';

type OutsidePressEvent = MouseEvent | TouchEvent | PointerEvent;

interface UseOutsidePressOptions {
  enabled?: boolean;
  capture?: boolean;
}

export function useOutsidePress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutsidePress: (event: OutsidePressEvent) => void,
  options: UseOutsidePressOptions = {},
) {
  const { enabled = true, capture = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: OutsidePressEvent) => {
      const element = ref.current;
      if (!element) return;
      if (element.contains(event.target as Node)) return;
      onOutsidePress(event);
    };

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
    const listenerOptions = { capture };

    if (supportsPointer) {
      document.addEventListener('pointerdown', handler as EventListener, listenerOptions);
      return () => {
        document.removeEventListener('pointerdown', handler as EventListener, listenerOptions);
      };
    }

    document.addEventListener('mousedown', handler as EventListener, listenerOptions);
    document.addEventListener('touchstart', handler as EventListener, listenerOptions);
    return () => {
      document.removeEventListener('mousedown', handler as EventListener, listenerOptions);
      document.removeEventListener('touchstart', handler as EventListener, listenerOptions);
    };
  }, [capture, enabled, onOutsidePress, ref]);
}
