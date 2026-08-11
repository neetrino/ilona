'use client';

import { useEffect, useState, type RefObject } from 'react';
import { getDropdownDirection } from '@/shared/lib/dropdown-placement';

/**
 * For menus positioned with `absolute` next to a trigger:
 * flip above the trigger when there is not enough space below.
 */
export function useAnchoredDropdownDirection(
  isOpen: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  estimatedMenuHeight: number,
) {
  const [openUpward, setOpenUpward] = useState(false);
  const [maxHeight, setMaxHeight] = useState(estimatedMenuHeight);

  useEffect(() => {
    if (!isOpen) {
      setOpenUpward(false);
      setMaxHeight(estimatedMenuHeight);
      return;
    }

    function updateDirection() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const next = getDropdownDirection(trigger.getBoundingClientRect(), estimatedMenuHeight);
      setOpenUpward(next.openUpward);
      setMaxHeight(next.maxHeight);
    }

    updateDirection();
    window.addEventListener('resize', updateDirection);
    window.addEventListener('scroll', updateDirection, true);
    return () => {
      window.removeEventListener('resize', updateDirection);
      window.removeEventListener('scroll', updateDirection, true);
    };
  }, [isOpen, estimatedMenuHeight, triggerRef]);

  return { openUpward, maxHeight };
}
