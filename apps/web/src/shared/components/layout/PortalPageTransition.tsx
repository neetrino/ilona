'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminNavEntries } from '@/shared/lib/admin-nav-entries';
import { PORTAL_CONTENT_SCROLL_ID } from '@/shared/lib/portal-mobile-layout';
import { stripLocaleFromPath } from '@/shared/lib/role-routes';

const PAGE_TRANSITION_MS = 0.38;
const PAGE_TRANSITION_OFFSET_PX = 18;
const PAGE_EASE = [0.22, 1, 0.36, 1] as const;

const STUDENT_NAV_HREFS = [
  '/student/dashboard',
  '/student/schedule',
  '/student/recordings',
  '/student/my-feedbacks',
  '/student/our-teachers',
  '/student/payments',
  '/student/analytics',
  '/student/attendance',
  '/student/settings',
] as const;

const TEACHER_NAV_HREFS = [
  '/teacher/dashboard',
  '/teacher/students',
  '/teacher/schedule',
  '/teacher/daily-duties',
  '/teacher/daily-plan',
  '/teacher/recordings',
  '/teacher/attendance-register',
  '/teacher/salary',
  '/teacher/analytics',
  '/teacher/settings',
] as const;

type SlideDirection = 'up' | 'down' | 'none';

type PortalPageTransitionProps = {
  children: ReactNode;
};

function getNavHrefs(role: string | undefined): readonly string[] {
  if (role === 'STUDENT') return STUDENT_NAV_HREFS;
  if (role === 'TEACHER') return TEACHER_NAV_HREFS;
  if (role === 'ADMIN' || role === 'MANAGER') {
    return getAdminNavEntries(role).map((entry) => entry.href);
  }
  return [];
}

function resolveNavIndex(pathWithoutLocale: string, hrefs: readonly string[]): number {
  let bestIndex = -1;
  let bestLength = -1;

  hrefs.forEach((href, index) => {
    if (
      pathWithoutLocale === href ||
      pathWithoutLocale.startsWith(`${href}/`)
    ) {
      if (href.length > bestLength) {
        bestIndex = index;
        bestLength = href.length;
      }
    }
  });

  return bestIndex;
}

function resolveSlideDirection(previousIndex: number, nextIndex: number): SlideDirection {
  if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) {
    return 'none';
  }
  return nextIndex > previousIndex ? 'up' : 'down';
}

/**
 * Soft enter animation for portal page content (MaMarie-style).
 * Direction follows sidebar order when both pages are in the nav.
 */
export function PortalPageTransition({ children }: PortalPageTransitionProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const role = useAuthStore((state) => state.user?.role);
  const pathWithoutLocale = stripLocaleFromPath(pathname);
  const hrefs = getNavHrefs(role);
  const navIndex = resolveNavIndex(pathWithoutLocale, hrefs);
  const transitionKey = navIndex >= 0 ? hrefs[navIndex] : pathWithoutLocale;

  const [slide, setSlide] = useState<{
    key: string;
    index: number;
    direction: SlideDirection;
  }>({
    key: transitionKey,
    index: navIndex,
    direction: 'none',
  });

  if (slide.key !== transitionKey) {
    setSlide({
      key: transitionKey,
      index: navIndex,
      direction: resolveSlideDirection(slide.index, navIndex),
    });
  }

  const direction =
    slide.key === transitionKey
      ? slide.direction
      : resolveSlideDirection(slide.index, navIndex);

  const yOffset =
    direction === 'up'
      ? PAGE_TRANSITION_OFFSET_PX
      : direction === 'down'
        ? -PAGE_TRANSITION_OFFSET_PX
        : PAGE_TRANSITION_OFFSET_PX;

  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const scrollParent = document.getElementById(PORTAL_CONTENT_SCROLL_ID);
    if (scrollParent) {
      scrollParent.scrollTop = 0;
    }
  }, [transitionKey]);

  if (reduceMotion) {
    return <div key={transitionKey}>{children}</div>;
  }

  return (
    <motion.div
      key={transitionKey}
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: PAGE_TRANSITION_MS,
        ease: PAGE_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
