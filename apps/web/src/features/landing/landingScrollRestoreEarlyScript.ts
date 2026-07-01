export const LANDING_SCROLL_RESTORE_PENDING_CLASS = 'landing-scroll-restore-pending';

/** Runs before React paint to avoid a visible jump to the top on Home refresh. */
export const LANDING_SCROLL_RESTORE_EARLY_SCRIPT = `
(function () {
  try {
    var pathname = window.location.pathname;
    var storageKey = 'scroll-position:' + pathname;
    var saved = sessionStorage.getItem(storageKey);
    var scrollY = saved !== null ? Number(saved) : NaN;
    var hash = window.location.hash.replace(/^#/, '').trim();
    var landingSections = ['home', 'about', 'courses', 'teachers', 'branches', 'contact', 'blog'];
    var hasHashTarget = hash.length > 0 && landingSections.indexOf(hash) >= 0 && hash !== 'home';
    var needsRestore = (!isNaN(scrollY) && scrollY > 0) || hasHashTarget;

    window.history.scrollRestoration = 'manual';

    if (!needsRestore) {
      return;
    }

    document.documentElement.classList.add('${LANDING_SCROLL_RESTORE_PENDING_CLASS}');

    if (!isNaN(scrollY) && scrollY > 0) {
      window.scrollTo(0, scrollY);
    }
  } catch (e) {}
})();
`.trim();
