'use client';

import { useMemo, useSyncExternalStore } from 'react';

function subscribeToViewportTier(notifier: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const mq1 = window.matchMedia('(min-width: 480px)');
  const mq2 = window.matchMedia('(min-width: 1024px)');
  mq1.addEventListener('change', notifier);
  mq2.addEventListener('change', notifier);
  return () => {
    mq1.removeEventListener('change', notifier);
    mq2.removeEventListener('change', notifier);
  };
}

function getMaxVisibleInCell(): number {
  if (typeof window === 'undefined') {
    return 2;
  }
  if (window.matchMedia('(min-width: 1024px)').matches) {
    return 3;
  }
  if (window.matchMedia('(min-width: 480px)').matches) {
    return 2;
  }
  return 1;
}

const serverMaxVisible = 2;

export function useMaxVisibleInCell(override: number | undefined): number {
  const subscribe = useMemo(
    () =>
      override === undefined
        ? subscribeToViewportTier
        : () => {
            if (typeof window === 'undefined') {
              return () => {};
            }
            return () => {};
          },
    [override],
  );
  return useSyncExternalStore(
    subscribe,
    () => (override !== undefined ? override : getMaxVisibleInCell()),
    () => (override !== undefined ? override : serverMaxVisible),
  );
}
