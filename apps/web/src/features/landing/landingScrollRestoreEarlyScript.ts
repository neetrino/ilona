import {
  LANDING_HEADER_SCROLL_OFFSET,
  LANDING_NAV_SECTION_IDS,
} from './landingNav';

export const LANDING_SCROLL_RESTORE_PENDING_CLASS = 'landing-scroll-restore-pending';

/** Runs before React paint to restore scroll position or hash target without a visible jump. */
export const LANDING_SCROLL_RESTORE_EARLY_SCRIPT = `
(function () {
  try {
    var pathname = window.location.pathname;
    var storageKey = 'scroll-position:' + pathname;
    var saved = sessionStorage.getItem(storageKey);
    var scrollY = saved !== null ? Number(saved) : NaN;
    var hash = window.location.hash.replace(/^#/, '').trim();
    var landingSections = ${JSON.stringify(LANDING_NAV_SECTION_IDS)};
    var hashIndex = landingSections.indexOf(hash);
    var hashTarget = hashIndex >= 0 && hash !== 'home' ? hash : null;
    var hasSavedScroll = !isNaN(scrollY) && scrollY > 0;
    var needsRestore = hashTarget !== null || hasSavedScroll;
    var headerOffset = ${LANDING_HEADER_SCROLL_OFFSET};

    window.history.scrollRestoration = 'manual';

    if (!needsRestore) {
      return;
    }

    document.documentElement.classList.add('${LANDING_SCROLL_RESTORE_PENDING_CLASS}');

    function scrollToSectionId(sectionId) {
      if (!sectionId || sectionId === 'home') {
        window.scrollTo(0, 0);
        return true;
      }

      var element = document.getElementById(sectionId);
      if (!element) {
        return false;
      }

      var top = element.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo(0, Math.max(0, top));
      return true;
    }

    function attemptRestore() {
      if (hashTarget) {
        if (scrollToSectionId(hashTarget)) {
          return;
        }

        var attempts = 0;
        function retry() {
          if (scrollToSectionId(hashTarget) || ++attempts >= 60) {
            return;
          }
          requestAnimationFrame(retry);
        }
        requestAnimationFrame(retry);
        return;
      }

      if (hasSavedScroll) {
        window.scrollTo(0, scrollY);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attemptRestore);
    } else {
      attemptRestore();
    }
  } catch (e) {}
})();
`.trim();
