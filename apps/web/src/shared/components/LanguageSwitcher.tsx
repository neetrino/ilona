'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { type Locale } from '@/config/i18n';
import { studentPillTrackClass } from '@/features/student-ui/tokens';
import { useSwitchLocale } from '@/shared/hooks/useSwitchLocale';
import { cn } from '@/shared/lib/utils';

type LanguageSwitcherProps = {
  variant?: 'default' | 'compact' | 'circle';
  className?: string;
};

const INDICATOR_TRANSITION =
  'transition-[transform,width,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

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
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Partial<Record<Locale, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

  useEffect(() => {
    if (isCircle) return;

    const syncIndicator = () => {
      const activeEl = buttonRefs.current[locale];
      const trackEl = trackRef.current;
      if (!activeEl || !trackEl) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      setIndicator({
        x: activeEl.offsetLeft,
        y: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        visible: true,
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [locale, isCircle]);

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
    'relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full font-medium transition-colors duration-300 motion-reduce:transition-none',
    BUTTON_FOCUS,
    isCompact ? 'gap-1 px-2 py-1 text-xs' : 'gap-2 px-4 py-1.5 text-sm',
  );

  return (
    <div
      ref={trackRef}
      role="group"
      aria-label={t('selectLanguage')}
      className={cn(
        isCompact
          ? 'inline-flex h-11 shrink-0 items-center gap-0.5 rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f3f3f4] p-0.5 sm:h-12'
          : cn(studentPillTrackClass, 'relative shrink-0 gap-0.5'),
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-0 rounded-full bg-[#1010a3] shadow-sm',
          INDICATOR_TRANSITION,
        )}
        style={{
          width: `${indicator.width}px`,
          height: `${indicator.height}px`,
          transform: `translate(${indicator.x}px, ${indicator.y}px)`,
          opacity: indicator.visible ? 1 : 0,
        }}
      />
      <button
        type="button"
        ref={(node) => {
          buttonRefs.current.hy = node;
        }}
        onClick={() => switchLocale('hy')}
        onKeyDown={(e) => handleKeyDown(e, 'hy')}
        aria-label={t('switchToArmenian')}
        aria-pressed={locale === 'hy'}
        className={cn(
          buttonClass,
          locale === 'hy' ? 'text-white' : 'text-[#3b3b40] hover:text-[#1010a3]',
        )}
      >
        <ArmenianFlag size={flagSize} />
        <span className="whitespace-nowrap">Հայ</span>
      </button>
      <button
        type="button"
        ref={(node) => {
          buttonRefs.current.en = node;
        }}
        onClick={() => switchLocale('en')}
        onKeyDown={(e) => handleKeyDown(e, 'en')}
        aria-label={t('switchToEnglish')}
        aria-pressed={locale === 'en'}
        className={cn(
          buttonClass,
          locale === 'en' ? 'text-white' : 'text-[#3b3b40] hover:text-[#1010a3]',
        )}
      >
        <UkFlag size={flagSize} />
        <span className="whitespace-nowrap">EN</span>
      </button>
    </div>
  );
}
