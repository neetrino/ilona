import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollPositionRestore(): void {
  const pathname = usePathname();

  useEffect(() => {
    const storageKey = `scroll-position:${pathname}`;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const restorePosition = () => {
      const savedPosition = sessionStorage.getItem(storageKey);
      if (!savedPosition) {
        return;
      }

      const top = Number(savedPosition);
      if (Number.isNaN(top)) {
        return;
      }

      window.scrollTo({ top, left: 0, behavior: 'auto' });
    };

    const savePosition = () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };

    requestAnimationFrame(restorePosition);
    window.addEventListener('beforeunload', savePosition);
    window.addEventListener('pagehide', savePosition);

    return () => {
      savePosition();
      window.removeEventListener('beforeunload', savePosition);
      window.removeEventListener('pagehide', savePosition);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [pathname]);
}
