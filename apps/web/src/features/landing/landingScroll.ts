import { LANDING_HEADER_SCROLL_OFFSET } from './landingNav';
import { LANDING_SCROLL_RESTORE_PENDING_CLASS } from './landingScrollRestoreEarlyScript';

export { LANDING_SCROLL_RESTORE_PENDING_CLASS };

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

export function getLandingSectionScrollTop(sectionId: string): number | null {
  if (sectionId === 'home') {
    return 0;
  }

  const element = document.getElementById(sectionId);
  if (!element) {
    return null;
  }

  const top =
    element.getBoundingClientRect().top + window.scrollY - LANDING_HEADER_SCROLL_OFFSET;

  return Math.max(0, top);
}

interface ScrollToPositionWhenReadyOptions {
  maxAttempts?: number;
  onSettled?: () => void;
}

export function releaseLandingScrollRestoreLock(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.remove(LANDING_SCROLL_RESTORE_PENDING_CLASS);
}

export function scrollToPositionWhenReady(
  resolveTarget: () => number | null,
  options: ScrollToPositionWhenReadyOptions = {},
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const maxAttempts = options.maxAttempts ?? 50;
  let attempts = 0;
  let cancelled = false;
  let rafId = 0;
  let settled = false;

  const finish = () => {
    if (settled) {
      return;
    }
    settled = true;
    options.onSettled?.();
  };

  const tryScroll = () => {
    if (cancelled) {
      return;
    }

    const target = resolveTarget();
    if (target === null) {
      attempts += 1;
      if (attempts >= maxAttempts) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(tryScroll);
      return;
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const top = Math.min(target, maxScroll);
    window.scrollTo({ top, left: 0, behavior: 'auto' });

    attempts += 1;
    const reached = Math.abs(window.scrollY - top) <= 3;
    const heightSufficient = target <= maxScroll + 3;

    if ((reached && heightSufficient) || attempts >= maxAttempts) {
      finish();
      return;
    }

    rafId = requestAnimationFrame(tryScroll);
  };

  const observer = new ResizeObserver(() => {
    if (cancelled || settled) {
      return;
    }
    attempts = Math.max(0, attempts - 5);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tryScroll);
  });
  observer.observe(document.documentElement);

  rafId = requestAnimationFrame(tryScroll);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    observer.disconnect();
  };
}
