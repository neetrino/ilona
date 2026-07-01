'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LANDING_HEADER_SCROLL_OFFSET, type LandingNavSectionId } from '../landingNav';
import {
  LANDING_SCROLL_RESTORE_PENDING_CLASS,
  LANDING_SCROLL_RESTORE_SETTLED_EVENT,
  resolveInitialLandingSection,
  scrollToLandingSection,
} from '../landingScroll';

const OBSERVER_ROOT_MARGIN = `-${LANDING_HEADER_SCROLL_OFFSET}px 0px -55% 0px`;
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
      setActiveSection(resolveActiveSection(sectionIds));
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
      if (!sectionIds.includes(sectionId)) {
        return;
      }

      setActiveSection(sectionId);
      isProgrammaticScrollRef.current = true;
      window.clearTimeout(scrollLockTimerRef.current);
      scrollToLandingSection(sectionId, { behavior: 'smooth' });

      scrollLockTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, SCROLL_LOCK_MS);

      const nextUrl = `${window.location.pathname}${window.location.search}#${sectionId}`;
      window.history.replaceState(null, '', nextUrl);
    },
    [sectionIds],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current || suppressScrollSyncRef.current) {
          return;
        }

        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          const nextSection = visibleEntries[0].target.id as LandingNavSectionId;
          if (sectionIds.includes(nextSection)) {
            setActiveSection(nextSection);
          }
          return;
        }

        setActiveSection(resolveActiveSection(sectionIds));
      },
      { rootMargin: OBSERVER_ROOT_MARGIN, threshold: [0, 0.15, 0.35, 0.55] },
    );

    elements.forEach((element) => observer.observe(element));

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current || suppressScrollSyncRef.current) {
        return;
      }
      setActiveSection(resolveActiveSection(sectionIds));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(scrollLockTimerRef.current);
    };
  }, [enabled, sectionIds]);

  return { activeSection, scrollToSection };
}
