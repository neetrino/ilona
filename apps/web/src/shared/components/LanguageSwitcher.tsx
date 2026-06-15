'use client';

import { type Locale } from '@/config/i18n';
import { useSwitchLocale } from '@/shared/hooks/useSwitchLocale';
import { cn } from '@/shared/lib/utils';

type LanguageSwitcherProps = {
  variant?: 'default' | 'compact' | 'circle';
  className?: string;
};

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const isCompact = variant === 'compact';
  const isCircle = variant === 'circle';
  const { locale, switchLocale } = useSwitchLocale();

  const handleKeyDown = (e: React.KeyboardEvent, targetLocale: Locale) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchLocale(targetLocale);
    }
  };

  if (isCircle) {
    const nextLocale: Locale = locale === 'en' ? 'hy' : 'en';
    const label = locale === 'en' ? 'EN' : 'HY';

    return (
      <button
        type="button"
        onClick={() => switchLocale(nextLocale)}
        onKeyDown={(e) => handleKeyDown(e, nextLocale)}
        aria-label={locale === 'en' ? 'Switch to Armenian' : 'Switch to English'}
        className={cn(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          'bg-[#f3f3f4] text-xs font-semibold tracking-wide text-[#1010a3]',
          'transition-colors hover:bg-[#ebebec] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/30',
          className,
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Select language"
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[rgba(14,14,16,0.07)]',
        isCompact ? 'h-11 bg-[#f3f3f4] p-0.5 sm:h-12' : 'gap-1 bg-slate-100 p-1',
      )}
    >
      <button
        type="button"
        onClick={() => switchLocale('hy')}
        onKeyDown={(e) => handleKeyDown(e, 'hy')}
        aria-label="Switch to Armenian"
        aria-pressed={locale === 'hy'}
        className={cn(
          'relative flex shrink-0 items-center gap-1 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
          isCompact ? 'px-2 py-1 text-xs' : 'gap-2 px-4 py-1.5 text-sm',
          locale === 'hy'
            ? isCompact
              ? 'bg-white text-[#5b5b62] shadow-sm'
              : 'bg-white text-slate-900 shadow-sm'
            : isCompact
              ? 'text-[#5b5b62] hover:text-[#1010a3]'
              : 'text-slate-600 hover:text-slate-900',
        )}
      >
        <svg
          width={isCompact ? 16 : 20}
          height={isCompact ? 12 : 15}
          viewBox="0 0 20 15"
          className="flex-shrink-0"
          aria-hidden="true"
        >
          {/* Armenian flag: red, blue, orange horizontal stripes */}
          <rect width="20" height="5" fill="#D90012" />
          <rect y="5" width="20" height="5" fill="#0033A0" />
          <rect y="10" width="20" height="5" fill="#F2A800" />
        </svg>
        <span className="whitespace-nowrap">Հայ</span>
      </button>
      <button
        type="button"
        onClick={() => switchLocale('en')}
        onKeyDown={(e) => handleKeyDown(e, 'en')}
        aria-label="Switch to English"
        aria-pressed={locale === 'en'}
        className={cn(
          'relative flex shrink-0 items-center gap-1 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
          isCompact ? 'px-2 py-1 text-xs' : 'gap-2 px-4 py-1.5 text-sm',
          locale === 'en'
            ? isCompact
              ? 'bg-[#1010a3] text-white shadow-sm'
              : 'bg-white text-slate-900 shadow-sm'
            : isCompact
              ? 'text-[#5b5b62] hover:text-[#1010a3]'
              : 'text-slate-600 hover:text-slate-900',
        )}
      >
        <svg
          width={isCompact ? 16 : 20}
          height={isCompact ? 12 : 15}
          viewBox="0 0 20 15"
          className="flex-shrink-0 rounded-sm overflow-hidden"
          aria-hidden="true"
        >
          {/* UK flag (Union Jack) - Navy blue background */}
          <rect width="20" height="15" fill="#012169" />
          
          {/* White St. Andrew's cross (diagonal - wider) */}
          <path
            d="M0 0 L20 15 M20 0 L0 15"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Red St. Patrick's cross (diagonal - narrower, on top of white) */}
          <path
            d="M0 0 L20 15 M20 0 L0 15"
            stroke="#C8102E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* White St. George's cross (horizontal and vertical - wider) */}
          <rect x="0" y="6" width="20" height="3" fill="#FFFFFF" />
          <rect x="8.5" y="0" width="3" height="15" fill="#FFFFFF" />
          
          {/* Red St. George's cross (horizontal and vertical - narrower, on top of white) */}
          <rect x="0" y="7" width="20" height="1" fill="#C8102E" />
          <rect x="9.5" y="0" width="1" height="15" fill="#C8102E" />
        </svg>
        <span className="whitespace-nowrap">EN</span>
      </button>
    </div>
  );
}
