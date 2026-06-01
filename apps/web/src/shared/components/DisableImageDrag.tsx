'use client';

import { useEffect } from 'react';

const isImageTarget = (target: EventTarget | null): target is HTMLImageElement =>
  target instanceof HTMLImageElement;

export function DisableImageDrag() {
  useEffect(() => {
    const preventImageInteraction = (event: Event) => {
      if (isImageTarget(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener('dragstart', preventImageInteraction);
    document.addEventListener('contextmenu', preventImageInteraction);

    return () => {
      document.removeEventListener('dragstart', preventImageInteraction);
      document.removeEventListener('contextmenu', preventImageInteraction);
    };
  }, []);

  return null;
}
