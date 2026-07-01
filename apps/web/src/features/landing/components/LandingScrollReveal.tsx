'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import {
  landingRevealFromLeftVariants,
  landingRevealFromRightVariants,
  landingRevealTransition,
  landingRevealVariants,
  landingViewport,
} from '../landingAnimations';

type RevealDirection = 'up' | 'left' | 'right';

const directionVariants = {
  up: landingRevealVariants,
  left: landingRevealFromLeftVariants,
  right: landingRevealFromRightVariants,
} as const;

interface LandingScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
}

export function LandingScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
}: LandingScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={landingViewport}
      variants={directionVariants[direction]}
      transition={landingRevealTransition(delay)}
    >
      {children}
    </motion.div>
  );
}
