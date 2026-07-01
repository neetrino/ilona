import { LANDING_HEADER_SCROLL_OFFSET } from './landingNav';

function getScrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function scrollToLandingSection(sectionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (sectionId === 'home') {
    window.scrollTo({ top: 0, behavior: getScrollBehavior() });
    return;
  }

  const element = document.getElementById(sectionId);
  if (!element) {
    return;
  }

  const behavior = getScrollBehavior();
  const top =
    element.getBoundingClientRect().top + window.scrollY - LANDING_HEADER_SCROLL_OFFSET;

  window.scrollTo({ top: Math.max(0, top), behavior });
}

export function getLandingSectionIdFromHash(hash: string): string | null {
  const sectionId = hash.replace(/^#/, '').trim();
  return sectionId.length > 0 ? sectionId : null;
}
