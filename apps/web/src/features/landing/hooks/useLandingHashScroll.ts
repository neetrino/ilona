'use client';

import { useEffect } from 'react';
import { LANDING_NAV_ITEMS, type LandingNavSectionId } from '../landingNav';
import { getLandingSectionIdFromHash } from '../landingScroll';

function isLandingNavSectionId(sectionId: string): sectionId is LandingNavSectionId {
  return LANDING_NAV_ITEMS.some((item) => item.id === sectionId);
}

export function useLandingHashScroll(
  scrollToSection: (sectionId: LandingNavSectionId) => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sectionId = getLandingSectionIdFromHash(window.location.hash);
    if (!sectionId || !isLandingNavSectionId(sectionId)) {
      return;
    }

    const timer = window.setTimeout(() => {
      scrollToSection(sectionId);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [enabled, scrollToSection]);
}
