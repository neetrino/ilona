import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LANDING_NAV_ITEMS, type LandingNavSectionId } from '../landingNav';
import {
  getLandingSectionIdFromHash,
  getLandingSectionScrollTop,
  releaseLandingScrollRestoreLock,
  scrollToPositionWhenReady,
} from '../landingScroll';

const RESTORE_LOCK_SAFETY_MS = 3000;

function isLandingNavSectionId(sectionId: string): sectionId is LandingNavSectionId {
  return LANDING_NAV_ITEMS.some((item) => item.id === sectionId);
}

function readSavedScrollTop(storageKey: string): number | null {
  const savedPosition = sessionStorage.getItem(storageKey);
  if (!savedPosition) {
    return null;
  }

  const top = Number(savedPosition);
  return Number.isNaN(top) ? null : top;
}

export function useScrollPositionRestore(): void {
  const pathname = usePathname();

  useEffect(() => {
    const storageKey = `scroll-position:${pathname}`;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    let isRestoring = true;
    let cancelRestore: (() => void) | undefined;
    let saveRaf = 0;

    const safetyTimer = window.setTimeout(releaseLandingScrollRestoreLock, RESTORE_LOCK_SAFETY_MS);

    const finishRestore = () => {
      isRestoring = false;
      window.clearTimeout(safetyTimer);
      releaseLandingScrollRestoreLock();
    };

    const restoreScroll = () => {
      cancelRestore?.();

      const savedTop = readSavedScrollTop(storageKey);
      if (savedTop !== null && savedTop > 0) {
        isRestoring = true;
        cancelRestore = scrollToPositionWhenReady(() => savedTop, { onSettled: finishRestore });
        return;
      }

      const hashSection = getLandingSectionIdFromHash(window.location.hash);
      if (hashSection && isLandingNavSectionId(hashSection)) {
        isRestoring = true;
        cancelRestore = scrollToPositionWhenReady(
          () => getLandingSectionScrollTop(hashSection),
          { onSettled: finishRestore },
        );
        return;
      }

      finishRestore();
    };

    const savePosition = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };

    const onScroll = () => {
      if (isRestoring) {
        return;
      }
      cancelAnimationFrame(saveRaf);
      saveRaf = requestAnimationFrame(savePosition);
    };

    const saveOnUnload = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };

    const onHashChange = () => {
      const hashSection = getLandingSectionIdFromHash(window.location.hash);
      if (!hashSection || !isLandingNavSectionId(hashSection)) {
        return;
      }

      cancelRestore?.();
      isRestoring = true;
      cancelRestore = scrollToPositionWhenReady(
        () => getLandingSectionScrollTop(hashSection),
        { onSettled: finishRestore },
      );
    };

    restoreScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('beforeunload', saveOnUnload);
    window.addEventListener('pagehide', saveOnUnload);
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.clearTimeout(safetyTimer);
      cancelAnimationFrame(saveRaf);
      cancelRestore?.();
      releaseLandingScrollRestoreLock();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('beforeunload', saveOnUnload);
      window.removeEventListener('pagehide', saveOnUnload);
      window.removeEventListener('hashchange', onHashChange);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [pathname]);
}
