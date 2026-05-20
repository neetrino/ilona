'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DESKTOP_NAV_MQ = '(min-width: 1280px)';

export function useHomeMobileNav(
  open: boolean,
  onClose: () => void,
): void {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_NAV_MQ);
    const onChange = () => {
      if (media.matches) onClose();
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [onClose]);
}
