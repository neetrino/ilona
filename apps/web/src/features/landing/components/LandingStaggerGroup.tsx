'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import {
  landingStaggerContainerVariants,
  landingStaggerItemVariants,
  landingViewport,
} from '../landingAnimations';

interface LandingStaggerGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function LandingStaggerGroup({ children, className }: LandingStaggerGroupProps) {
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
      variants={landingStaggerContainerVariants}
    >
      {children}
    </motion.div>
  );
}

interface LandingStaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function LandingStaggerItem({ children, className }: LandingStaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={cn(className)} variants={landingStaggerItemVariants}>
      {children}
    </motion.div>
  );
}

interface LandingStaggerArticleProps {
  children: React.ReactNode;
  className?: string;
}

export function LandingStaggerArticle({ children, className }: LandingStaggerArticleProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <article className={className}>{children}</article>;
  }

  return (
    <motion.article className={cn(className)} variants={landingStaggerItemVariants}>
      {children}
    </motion.article>
  );
}
