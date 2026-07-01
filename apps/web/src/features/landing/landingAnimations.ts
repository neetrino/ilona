import type { Transition, Variants, ViewportOptions } from 'framer-motion';

export const landingViewport: ViewportOptions = {
  once: true,
  margin: '0px 0px -80px 0px',
  amount: 0.2,
};

export const landingRevealVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const landingRevealFromLeftVariants: Variants = {
  hidden: { opacity: 0, x: -28, scale: 0.98 },
  visible: { opacity: 1, x: 0, scale: 1 },
};

export const landingRevealFromRightVariants: Variants = {
  hidden: { opacity: 0, x: 28, scale: 0.98 },
  visible: { opacity: 1, x: 0, scale: 1 },
};

export const landingStaggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const landingStaggerItemVariants: Variants = landingRevealVariants;

export const landingHeroEntranceVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const landingImageRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: { opacity: 1, scale: 1 },
};

export function landingRevealTransition(delay = 0): Transition {
  return { duration: 0.6, ease: 'easeOut', delay };
}

export function landingHeroTransition(delay = 0, duration = 0.65): Transition {
  return { duration, ease: 'easeOut', delay };
}

export const LANDING_PREMIUM_CARD_CLASS =
  'transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0px_20px_40px_-12px_rgba(9,51,148,0.18)]';
