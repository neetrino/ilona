import { useState } from 'react';
import { BRANCH_CAROUSEL_ITEMS } from '../landingConstants';

export function useBranchCarousel() {
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);
  const [branchSlideDirection, setBranchSlideDirection] = useState(1);
  const [hasBranchInteracted, setHasBranchInteracted] = useState(false);

  const totalCarouselItems = BRANCH_CAROUSEL_ITEMS.length;
  const getWrappedIndex = (index: number) => (index + totalCarouselItems) % totalCarouselItems;
  const activeBranch = BRANCH_CAROUSEL_ITEMS[activeBranchIndex];
  const leftBranch = BRANCH_CAROUSEL_ITEMS[getWrappedIndex(activeBranchIndex - 1)];
  const rightBranch = BRANCH_CAROUSEL_ITEMS[getWrappedIndex(activeBranchIndex + 1)];

  const goToPreviousBranch = () => {
    setHasBranchInteracted(true);
    setBranchSlideDirection(-1);
    setActiveBranchIndex((prev) => getWrappedIndex(prev - 1));
  };

  const goToNextBranch = () => {
    setHasBranchInteracted(true);
    setBranchSlideDirection(1);
    setActiveBranchIndex((prev) => getWrappedIndex(prev + 1));
  };

  const branchImageTransition = { duration: 0.46, ease: [0.22, 1, 0.36, 1] } as const;
  const branchImageVariants = {
    enter: (direction: number) => ({ x: direction * 42, opacity: 0, scale: 0.985 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (direction: number) => ({ x: direction * -42, opacity: 0, scale: 0.985 }),
  } as const;

  return {
    activeBranch,
    leftBranch,
    rightBranch,
    branchSlideDirection,
    hasBranchInteracted,
    goToPreviousBranch,
    goToNextBranch,
    branchImageTransition,
    branchImageVariants,
  };
}
