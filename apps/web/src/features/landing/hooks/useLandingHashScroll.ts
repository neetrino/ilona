'use client';

import { useEffect } from 'react';
import { LANDING_NAV_ITEMS, type LandingNavSectionId } from '../landingNav';
import {
  getLandingSectionIdFromHash,
  isLandingNavSectionId,
  scrollToLandingSection,
} from '../landingScroll';

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

    scrollToSection(sectionId);
  }, [enabled, scrollToSection]);
}

/** @deprecated Prefer useScrollPositionRestore for refresh restoration. */
export function scrollToLandingHashSection(sectionId: LandingNavSectionId): void {
  if (!LANDING_NAV_ITEMS.some((item) => item.id === sectionId)) {
    return;
  }

  scrollToLandingSection(sectionId, { behavior: 'auto' });
}
