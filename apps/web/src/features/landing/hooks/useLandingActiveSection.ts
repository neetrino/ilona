'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LANDING_HEADER_SCROLL_OFFSET, type LandingNavSectionId } from '../landingNav';
import {
  LANDING_SCROLL_RESTORE_PENDING_CLASS,
  LANDING_SCROLL_RESTORE_SETTLED_EVENT,
  resolveInitialLandingSection,
  scrollToLandingSection,
} from '../landingScroll';

const SCROLL_LOCK_MS = 900;

function resolveActiveSection(sectionIds: readonly LandingNavSectionId[]): LandingNavSectionId {
  const marker = window.scrollY + LANDING_HEADER_SCROLL_OFFSET + 8;
  let current = sectionIds[0] ?? 'home';

  for (const sectionId of sectionIds) {
    const element = document.getElementById(sectionId);
    if (element && element.offsetTop <= marker) {
      current = sectionId;
    }
  }

  return current;
}

export function useLandingActiveSection(
  sectionIds: readonly LandingNavSectionId[],
  enabled: boolean,
) {
  const [activeSection, setActiveSection] = useState<LandingNavSectionId>(
    sectionIds[0] ?? 'home',
  );
  const isProgrammaticScrollRef = useRef(false);
  const scrollLockTimerRef = useRef<number | undefined>(undefined);
  const suppressScrollSyncRef = useRef(true);
  const activeSectionRef = useRef(activeSection);

  useLayoutEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useLayoutEffect(() => {
    if (!enabled) {
      suppressScrollSyncRef.current = false;
      return;
    }

    setActiveSection(resolveInitialLandingSection(sectionIds));
  }, [enabled, sectionIds]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const enableScrollSync = () => {
      suppressScrollSyncRef.current = false;
      const next = resolveActiveSection(sectionIds);
      if (next !== activeSectionRef.current) {
        setActiveSection(next);
      }
    };

    if (!document.documentElement.classList.contains(LANDING_SCROLL_RESTORE_PENDING_CLASS)) {
      enableScrollSync();
    }

    window.addEventListener(LANDING_SCROLL_RESTORE_SETTLED_EVENT, enableScrollSync);

    return () => {
      window.removeEventListener(LANDING_SCROLL_RESTORE_SETTLED_EVENT, enableScrollSync);
    };
  }, [enabled, sectionIds]);

  const scrollToSection = useCallback(
    (sectionId: LandingNavSectionId) => {
      if (!enabled || !sectionIds.includes(sectionId)) {
        return;
      }

      setActiveSection(sectionId);
      isProgrammaticScrollRef.current = true;
      window.clearTimeout(scrollLockTimerRef.current);
      scrollToLandingSection(sectionId, { behavior: 'smooth' });

      scrollLockTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, SCROLL_LOCK_MS);
    },
    [enabled, sectionIds],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let rafId = 0;
    let scrollPending = false;

    const syncActiveSection = () => {
      scrollPending = false;

      if (isProgrammaticScrollRef.current || suppressScrollSyncRef.current) {
        return;
      }

      const next = resolveActiveSection(sectionIds);
      if (next !== activeSectionRef.current) {
        setActiveSection(next);
      }
    };

    const onScroll = () => {
      if (scrollPending) {
        return;
      }

      scrollPending = true;
      rafId = window.requestAnimationFrame(syncActiveSection);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(scrollLockTimerRef.current);
    };
  }, [enabled, sectionIds]);

  return { activeSection, scrollToSection };
}
