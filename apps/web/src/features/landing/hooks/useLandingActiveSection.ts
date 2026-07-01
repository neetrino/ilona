'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LANDING_HEADER_SCROLL_OFFSET, type LandingNavSectionId } from '../landingNav';
import { scrollToLandingSection } from '../landingScroll';

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
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? 'home');
  const isProgrammaticScrollRef = useRef(false);
  const scrollLockTimerRef = useRef<number | undefined>(undefined);

  const scrollToSection = useCallback(
    (sectionId: LandingNavSectionId) => {
      if (!sectionIds.includes(sectionId)) {
        return;
      }

      setActiveSection(sectionId);
      isProgrammaticScrollRef.current = true;
      window.clearTimeout(scrollLockTimerRef.current);
      scrollToLandingSection(sectionId);

      scrollLockTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, SCROLL_LOCK_MS);

      if (typeof window !== 'undefined') {
        const nextUrl = `${window.location.pathname}${window.location.search}#${sectionId}`;
        window.history.replaceState(null, '', nextUrl);
      }
    },
    [sectionIds],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setActiveSection(resolveActiveSection(sectionIds));

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) {
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
      if (isProgrammaticScrollRef.current) {
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
