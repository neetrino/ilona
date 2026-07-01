'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BRANCH_CAROUSEL_ITEMS } from '../landingConstants';
import {
  BRANCH_CAROUSEL_AUTO_INTERVAL_MS,
  BRANCH_CAROUSEL_CARD_WIDTH,
  BRANCH_CAROUSEL_GAP,
  BRANCH_CAROUSEL_PAUSE_AFTER_MANUAL_MS,
  buildLoopedBranches,
  getActiveBranchIndex,
  getBranchCarouselSlotWidth,
  getLoopResetPosition,
} from '../branchCarouselConfig';

const TABLET_MEDIA_QUERY = '(min-width: 744px)';
const NAV_DESKTOP_MEDIA_QUERY = '(min-width: 1367px)';

export function useBranchCarousel() {
  const totalItems = BRANCH_CAROUSEL_ITEMS.length;
  const startPosition = totalItems > 1 ? totalItems : 0;

  const [positionIndex, setPositionIndex] = useState(startPosition);
  const [isInstantReset, setIsInstantReset] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const pauseTimeoutRef = useRef<number | null>(null);

  const loopedBranches = buildLoopedBranches(BRANCH_CAROUSEL_ITEMS);
  const activeIndex = getActiveBranchIndex(positionIndex, totalItems);

  const pauseAutoSlide = useCallback(() => {
    setIsAutoPaused(true);

    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
    }

    pauseTimeoutRef.current = window.setTimeout(() => {
      setIsAutoPaused(false);
      pauseTimeoutRef.current = null;
    }, BRANCH_CAROUSEL_PAUSE_AFTER_MANUAL_MS);
  }, []);

  const goToNext = useCallback(() => {
    if (totalItems <= 1) {
      return;
    }

    pauseAutoSlide();
    setIsInstantReset(false);
    setPositionIndex((prev) => prev + 1);
  }, [pauseAutoSlide, totalItems]);

  const goToPrevious = useCallback(() => {
    if (totalItems <= 1) {
      return;
    }

    pauseAutoSlide();
    setIsInstantReset(false);
    setPositionIndex((prev) => prev - 1);
  }, [pauseAutoSlide, totalItems]);

  const goToIndex = useCallback(
    (index: number) => {
      if (totalItems <= 1) {
        return;
      }

      const normalizedIndex = ((index % totalItems) + totalItems) % totalItems;

      if (normalizedIndex === activeIndex) {
        return;
      }

      pauseAutoSlide();
      setIsInstantReset(false);
      setPositionIndex(totalItems + normalizedIndex);
    },
    [activeIndex, pauseAutoSlide, totalItems],
  );

  const handleSlideComplete = useCallback(() => {
    if (totalItems <= 1 || isInstantReset) {
      return;
    }

    const resetPosition = getLoopResetPosition(positionIndex, totalItems);

    if (resetPosition === null) {
      return;
    }

    setIsInstantReset(true);
    setPositionIndex(resetPosition);
    requestAnimationFrame(() => {
      setIsInstantReset(false);
    });
  }, [isInstantReset, positionIndex, totalItems]);

  useEffect(() => {
    if (totalItems <= 1 || isAutoPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIsInstantReset(false);
      setPositionIndex((prev) => prev + 1);
    }, BRANCH_CAROUSEL_AUTO_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isAutoPaused, totalItems]);

  useEffect(
    () => () => {
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
    },
    [],
  );

  return {
    branches: BRANCH_CAROUSEL_ITEMS,
    loopedBranches,
    positionIndex,
    activeIndex,
    totalItems,
    isInstantReset,
    goToNext,
    goToPrevious,
    goToIndex,
    handleSlideComplete,
  };
}

export function useBranchCarouselLayout() {
  const [layout, setLayout] = useState<{
    cardWidth: number;
    gap: number;
    slotWidth: number;
  }>({
    cardWidth: BRANCH_CAROUSEL_CARD_WIDTH.mobile,
    gap: BRANCH_CAROUSEL_GAP.mobile,
    slotWidth: getBranchCarouselSlotWidth(
      BRANCH_CAROUSEL_CARD_WIDTH.mobile,
      BRANCH_CAROUSEL_GAP.mobile,
    ),
  });

  useEffect(() => {
    const tabletQuery = window.matchMedia(TABLET_MEDIA_QUERY);
    const navDesktopQuery = window.matchMedia(NAV_DESKTOP_MEDIA_QUERY);

    const updateLayout = () => {
      const cardWidth = navDesktopQuery.matches
        ? BRANCH_CAROUSEL_CARD_WIDTH.navDesktop
        : tabletQuery.matches
          ? BRANCH_CAROUSEL_CARD_WIDTH.tablet
          : BRANCH_CAROUSEL_CARD_WIDTH.mobile;

      const gap = tabletQuery.matches
        ? BRANCH_CAROUSEL_GAP.desktop
        : BRANCH_CAROUSEL_GAP.mobile;

      setLayout({
        cardWidth,
        gap,
        slotWidth: getBranchCarouselSlotWidth(cardWidth, gap),
      });
    };

    updateLayout();
    tabletQuery.addEventListener('change', updateLayout);
    navDesktopQuery.addEventListener('change', updateLayout);

    return () => {
      tabletQuery.removeEventListener('change', updateLayout);
      navDesktopQuery.removeEventListener('change', updateLayout);
    };
  }, []);

  return layout;
}
