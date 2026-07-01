import type { Transition } from 'framer-motion';

export const BRANCH_CAROUSEL_AUTO_INTERVAL_MS = 4500;
export const BRANCH_CAROUSEL_PAUSE_AFTER_MANUAL_MS = 8000;

export const BRANCH_CAROUSEL_CARD = {
  center: { scale: 1, zIndex: 20 },
  side: { scale: 0.88, zIndex: 10 },
} as const;

/** Gap between card slots (px) — keeps cards from overlapping during slide */
export const BRANCH_CAROUSEL_GAP = {
  mobile: 28,
  desktop: 56,
} as const;

export const BRANCH_CAROUSEL_CARD_WIDTH = {
  mobile: 340,
  tablet: 553,
  navDesktop: 722,
} as const;

export const BRANCH_CAROUSEL_TRANSITION: Transition = {
  duration: 0.6,
  ease: [0.45, 0, 0.2, 1],
};

export function getBranchCarouselSlotWidth(cardWidth: number, gap: number): number {
  return cardWidth + gap;
}

export function buildLoopedBranches<T>(branches: readonly T[]): T[] {
  if (branches.length <= 1) {
    return [...branches];
  }

  return [...branches, ...branches, ...branches];
}

export function getLoopResetPosition(positionIndex: number, total: number): number | null {
  if (total <= 1) {
    return null;
  }

  if (positionIndex >= total * 2) {
    return positionIndex - total;
  }

  if (positionIndex < total) {
    return positionIndex + total;
  }

  return null;
}

export function getActiveBranchIndex(positionIndex: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return ((positionIndex % total) + total) % total;
}
