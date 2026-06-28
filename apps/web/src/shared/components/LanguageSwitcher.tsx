'use client';

import { useTranslations } from 'next-intl';
import { type Locale } from '@/config/i18n';
import { useSwitchLocale } from '@/shared/hooks/useSwitchLocale';
import { cn } from '@/shared/lib/utils';
import {
  SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS,
  SEGMENTED_TOGGLE_BUTTON_CLASS,
  SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
  SEGMENTED_TOGGLE_INDICATOR_CLASS,
  SEGMENTED_TOGGLE_TRACK_CLASS,
  SEGMENTED_TOGGLE_TWO_SEGMENT_WIDTH_CLASS,
} from '@/shared/components/ui/segmented-toggle-theme';

type LanguageSwitcherProps = {
  variant?: 'default' | 'compact' | 'circle';
  className?: string;
};

const BUTTON_FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/20 focus-visible:ring-offset-2';

function ArmenianFlag({ size }: { size: { width: number; height: number } }) {
  return (
    <svg
      width={size.width}
      height={size.height}
      viewBox="0 0 20 15"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect width="20" height="5" fill="#D90012" />
      <rect y="5" width="20" height="5" fill="#0033A0" />
      <rect y="10" width="20" height="5" fill="#F2A800" />
    </svg>
  );
}

function UkFlag({ size }: { size: { width: number; height: number } }) {
  return (
    <svg
      width={size.width}
      height={size.height}
      viewBox="0 0 20 15"
      className="shrink-0 overflow-hidden rounded-sm"
      aria-hidden="true"
    >
      <rect width="20" height="15" fill="#012169" />
      <path
        d="M0 0 L20 15 M20 0 L0 15"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 0 L20 15 M20 0 L0 15"
        stroke="#C8102E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="0" y="6" width="20" height="3" fill="#FFFFFF" />
      <rect x="8.5" y="0" width="3" height="15" fill="#FFFFFF" />
      <rect x="0" y="7" width="20" height="1" fill="#C8102E" />
      <rect x="9.5" y="0" width="1" height="15" fill="#C8102E" />
    </svg>
  );
}

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const t = useTranslations('language');
  const isCompact = variant === 'compact';
  const isCircle = variant === 'circle';
  const { locale, switchLocale } = useSwitchLocale();

  const handleKeyDown = (e: React.KeyboardEvent, targetLocale: Locale) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchLocale(targetLocale);
    }
  };

  const flagSize = isCompact ? { width: 16, height: 12 } : { width: 20, height: 15 };

  if (isCircle) {
    const nextLocale: Locale = locale === 'en' ? 'hy' : 'en';
    const label = locale === 'en' ? 'EN' : 'Հայ';

    return (
      <button
        type="button"
        onClick={() => switchLocale(nextLocale)}
        onKeyDown={(e) => handleKeyDown(e, nextLocale)}
        aria-label={locale === 'en' ? t('switchToArmenian') : t('switchToEnglish')}
        className={cn(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          'bg-white text-xs font-bold tracking-wide text-[#1010a3]',
          'transition-colors hover:bg-[#f3f3f4]',
          BUTTON_FOCUS,
          className,
        )}
      >
        {label}
      </button>
    );
  }

  const buttonClass = cn(
    SEGMENTED_TOGGLE_BUTTON_CLASS,
    'gap-1.5 shrink-0',
    BUTTON_FOCUS,
    isCompact ? 'text-xs' : 'text-sm',
  );

  return (
    <div
      role="group"
      aria-label={t('selectLanguage')}
      className={cn(SEGMENTED_TOGGLE_TRACK_CLASS, 'inline-flex shrink-0', className)}
    >
      <span
        aria-hidden
        className={cn(
          SEGMENTED_TOGGLE_INDICATOR_CLASS,
          SEGMENTED_TOGGLE_TWO_SEGMENT_WIDTH_CLASS,
          locale === 'en' && 'translate-x-full',
        )}
      />
      <button
        type="button"
        onClick={() => switchLocale('hy')}
        onKeyDown={(e) => handleKeyDown(e, 'hy')}
        aria-label={t('switchToArmenian')}
        aria-pressed={locale === 'hy'}
        className={cn(
          buttonClass,
          locale === 'hy' ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
        )}
      >
        <ArmenianFlag size={flagSize} />
        <span className="whitespace-nowrap">Հայ</span>
      </button>
      <button
        type="button"
        onClick={() => switchLocale('en')}
        onKeyDown={(e) => handleKeyDown(e, 'en')}
        aria-label={t('switchToEnglish')}
        aria-pressed={locale === 'en'}
        className={cn(
          buttonClass,
          locale === 'en' ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
        )}
      >
        <UkFlag size={flagSize} />
        <span className="whitespace-nowrap">EN</span>
      </button>
    </div>
  );
}
