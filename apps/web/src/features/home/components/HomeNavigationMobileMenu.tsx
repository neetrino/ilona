'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { NavItem } from './home-navigation.types';

interface HomeNavigationMobileMenuProps {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  navHref: (hash: string) => string;
  registerHref: string;
}

export function HomeNavigationMobileMenu({
  open,
  onClose,
  items,
  navHref,
  registerHref,
}: HomeNavigationMobileMenuProps) {
  const t = useTranslations('home');

  return (
    <>
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-200 xl:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <div
        id="home-mobile-nav"
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label={t('navMobileMenuLabel')}
        className={cn(
          'absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-full border border-white/10 bg-[#093394] shadow-xl transition-[opacity,transform] duration-200 xl:hidden',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0',
        )}
      >
        <ul className="flex flex-col p-2">
          {items.map(({ key, hash }) => (
            <li key={key}>
              <Link
                href={navHref(hash)}
                className="flex min-h-11 items-center rounded-xl px-4 py-3 text-base font-normal text-white transition-colors hover:bg-white/10 active:bg-white/15"
                onClick={onClose}
              >
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-white/15 p-3">
          <Link
            href={registerHref}
            className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#e7000b] px-4 text-base font-bold text-white transition-colors hover:bg-[#c40009] active:bg-[#a30008]"
            onClick={onClose}
          >
            {t('registerNow')}
          </Link>
        </div>
      </div>
    </>
  );
}
