'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { type Locale } from '@/config/i18n';
import { useSwitchLocale } from '@/shared/hooks/useSwitchLocale';
import { cn } from '@/shared/lib/utils';

type LandingNavbarLanguageToggleProps = {
  className?: string;
};

const INDICATOR_TRANSITION =
  'transition-[transform,width,height] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

const BUTTON_FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/20 focus-visible:ring-offset-2';

export function LandingNavbarLanguageToggle({ className }: LandingNavbarLanguageToggleProps) {
  const t = useTranslations('language');
  const { locale, switchLocale } = useSwitchLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Partial<Record<Locale, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ x: 0, y: 0, width: 0, height: 0, ready: false });
  const [animateIndicator, setAnimateIndicator] = useState(false);

  useLayoutEffect(() => {
    const syncIndicator = () => {
      const activeEl = buttonRefs.current[locale];
      const trackEl = trackRef.current;
      if (!activeEl || !trackEl) {
        setIndicator((prev) => ({ ...prev, ready: false }));
        return;
      }
      setIndicator({
        x: activeEl.offsetLeft,
        y: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight,
        ready: true,
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [locale]);

  useLayoutEffect(() => {
    const frameId = requestAnimationFrame(() => setAnimateIndicator(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  const buttonClass = cn(
    'relative z-10 min-w-[38px] rounded-full px-2 py-1 text-[11px] font-medium transition-colors duration-300 motion-reduce:transition-none sm:min-w-[42px] sm:text-[12px]',
    BUTTON_FOCUS,
  );

  return (
    <div
      ref={trackRef}
      role="group"
      aria-label={t('selectLanguage')}
      className={cn(
        'relative inline-flex items-center rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f3f3f4] p-[3px]',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-0 rounded-full bg-[#1010a3] shadow-sm',
          animateIndicator ? INDICATOR_TRANSITION : 'transition-none',
        )}
        style={{
          width: `${indicator.width}px`,
          height: `${indicator.height}px`,
          transform: `translate(${indicator.x}px, ${indicator.y}px)`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      <button
        type="button"
        ref={(node) => {
          buttonRefs.current.hy = node;
        }}
        onClick={() => switchLocale('hy')}
        aria-label={t('switchToArmenian')}
        aria-pressed={locale === 'hy'}
        className={cn(buttonClass, locale === 'hy' ? 'text-white' : 'text-[#3b3b40] hover:text-[#1010a3]')}
      >
        ՀԱՅ
      </button>
      <button
        type="button"
        ref={(node) => {
          buttonRefs.current.en = node;
        }}
        onClick={() => switchLocale('en')}
        aria-label={t('switchToEnglish')}
        aria-pressed={locale === 'en'}
        className={cn(buttonClass, locale === 'en' ? 'text-white' : 'text-[#3b3b40] hover:text-[#1010a3]')}
      >
        EN
      </button>
    </div>
  );
}
