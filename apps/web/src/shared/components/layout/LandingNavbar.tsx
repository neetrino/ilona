'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';
import { locales, type Locale } from '@/config/i18n';
import { cn } from '@/shared/lib/utils';

type LandingNavbarProps = {
  logoUrl: string;
  profileHref: string;
};

type NavItem = {
  id: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'home', href: '#home' },
  { id: 'about', href: '#about' },
  { id: 'courses', href: '#courses' },
  { id: 'teachers', href: '#teachers' },
  { id: 'branches', href: '#branches' },
  { id: 'contact', href: '#contact' },
  { id: 'blog', href: '#contact' },
];
export function LandingNavbar({ logoUrl, profileHref }: LandingNavbarProps) {
  const t = useTranslations('home.nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;

    const segments = pathname.split('/').filter(Boolean);
    const normalizedPath = segments[0] && locales.includes(segments[0] as Locale)
      ? `/${segments.slice(1).join('/')}`
      : pathname;

    const queryString = searchParams.toString();
    const nextPath = queryString ? `${normalizedPath || '/'}?${queryString}` : normalizedPath || '/';
    router.replace(nextPath, { scroll: false });
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
      <div className="mx-auto flex h-[70px] w-full max-w-[1280px] items-center justify-between rounded-[100px] bg-[#093394] px-4 shadow-lg sm:px-5">
        <Link href="#home" onClick={handleLogoClick} className="flex min-w-0 items-center gap-3">
          <div className="relative h-[52px] w-[52px] overflow-hidden rounded-full bg-white ring-2 ring-white/40">
            <Image src={logoUrl} alt="Ilona English Centre" fill className="object-contain" unoptimized />
          </div>
          <span className="hidden truncate text-[20px] font-bold tracking-[-0.18px] text-white md:block">
            {t('brand')}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 tablet:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.id} href={item.href} className="text-base font-normal tracking-[-0.3px] text-white transition-opacity hover:opacity-80">
              {t(item.id)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f3f3f4] p-[3px]">
            <button
              type="button"
              onClick={() => switchLocale('hy')}
              className={cn(
                'min-w-[42px] rounded-full px-2 py-1 text-[12px] font-medium transition-colors',
                locale === 'hy' ? 'bg-[#093394] text-white' : 'text-[#5b5b62]/80',
              )}
            >
              ՀԱՅ
            </button>
            <button
              type="button"
              onClick={() => switchLocale('en')}
              className={cn(
                'min-w-[42px] rounded-full px-2 py-1 text-[12px] font-medium transition-colors',
                locale === 'en' ? 'bg-[#093394] text-white' : 'text-[#5b5b62]/80',
              )}
            >
              EN
            </button>
          </div>

          <Link
            href={profileHref}
            aria-label={t('profile')}
            className="relative inline-flex h-[37px] w-[37px] shrink-0 items-center justify-center overflow-hidden rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
              <g clipPath="url(#clip0_8_25)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18 2.07233C8.33475 2.07233 0.5 9.90708 0.5 19.5723C0.5 29.2376 8.33475 37.0723 18 37.0723C27.6652 37.0723 35.5 29.2376 35.5 19.5723C35.5 9.90708 27.6652 2.07233 18 2.07233ZM11.875 15.1973C11.875 14.393 12.0334 13.5965 12.3412 12.8534C12.649 12.1103 13.1002 11.4351 13.669 10.8663C14.2377 10.2975 14.9129 9.84637 15.6561 9.53856C16.3992 9.23075 17.1957 9.07233 18 9.07233C18.8043 9.07233 19.6008 9.23075 20.3439 9.53856C21.0871 9.84637 21.7623 10.2975 22.331 10.8663C22.8998 11.4351 23.351 12.1103 23.6588 12.8534C23.9666 13.5965 24.125 14.393 24.125 15.1973C24.125 16.8218 23.4797 18.3797 22.331 19.5284C21.1824 20.677 19.6245 21.3223 18 21.3223C16.3755 21.3223 14.8176 20.677 13.669 19.5284C12.5203 18.3797 11.875 16.8218 11.875 15.1973ZM28.9515 28.2943C27.6411 29.9417 25.9756 31.2719 24.0794 32.1858C22.1831 33.0997 20.105 33.5737 18 33.5723C15.895 33.5737 13.8169 33.0997 11.9206 32.1858C10.0244 31.2719 8.35892 29.9417 7.0485 28.2943C9.88525 26.2591 13.7563 24.8223 18 24.8223C22.2437 24.8223 26.1147 26.2591 28.9515 28.2943Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_8_25">
                  <rect width="37" height="37" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
