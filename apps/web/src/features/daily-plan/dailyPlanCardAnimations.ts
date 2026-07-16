import type { Transition, Variants, ViewportOptions } from 'framer-motion';

/** Soft horizontal enter when Daily Plan cards scroll into view. */
export const dailyPlanCardListTransition: Transition = {
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1],
};

export const dailyPlanCardViewport: ViewportOptions = {
  once: true,
  amount: 0.25,
  margin: '0px 0px -48px 0px',
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
};
