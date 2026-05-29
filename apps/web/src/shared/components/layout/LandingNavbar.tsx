'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CircleUserRound } from 'lucide-react';
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
    const segments = pathname.split('/');
    if (segments[1] && locales.includes(segments[1] as Locale)) {
      segments[1] = nextLocale;
    } else {
      segments.splice(1, 0, nextLocale);
    }
    const queryString = searchParams.toString();
    const nextPath = queryString ? `${segments.join('/')}?${queryString}` : segments.join('/');
    router.push(nextPath);
    router.refresh();
  };

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
      <div className="mx-auto flex h-[70px] max-w-[1280px] items-center justify-between rounded-[100px] bg-[#093394] px-4 shadow-lg sm:px-5">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3">
          <div className="relative h-[52px] w-[52px] overflow-hidden rounded-full bg-white ring-2 ring-white/40">
            <Image src={logoUrl} alt="Ilona English Centre" fill className="object-contain" unoptimized />
          </div>
          <span className="hidden truncate text-[22px] font-bold tracking-[-0.18px] text-white md:block">
            {t('brand')}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
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
                locale === 'hy' ? 'bg-white text-[#5b5b62]' : 'text-[#5b5b62]/80',
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white/10"
          >
            <CircleUserRound className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
