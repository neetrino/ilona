import type { Transition, Variants } from 'framer-motion';

/** Soft horizontal enter for Daily Plan search results (from left / right). */
export const dailyPlanCardListTransition: Transition = {
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1],
};

export const dailyPlanCardExitTransition: Transition = {
  duration: 0.32,
  ease: [0.4, 0, 0.2, 1],
};

export const dailyPlanCardContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

/** `custom` is the card index: even → from left, odd → from right. */
export const dailyPlanCardItemVariants: Variants = {
  hidden: (index: number) => ({
    opacity: 0,
    x: index % 2 === 0 ? -56 : 56,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: dailyPlanCardListTransition,
  },
  exit: (index: number) => ({
    opacity: 0,
    x: index % 2 === 0 ? -36 : 36,
    transition: dailyPlanCardExitTransition,
  }),
};
