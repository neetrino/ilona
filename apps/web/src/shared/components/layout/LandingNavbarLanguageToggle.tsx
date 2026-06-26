'use client';

import { useSwitchLocale } from '@/shared/hooks/useSwitchLocale';
import { cn } from '@/shared/lib/utils';

type LandingNavbarLanguageToggleProps = {
  isCanvasActive?: boolean;
  className?: string;
};

export function LandingNavbarLanguageToggle({
  isCanvasActive = false,
  className,
}: LandingNavbarLanguageToggleProps) {
  const { locale, switchLocale } = useSwitchLocale();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f3f3f4] p-[3px]',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => switchLocale('hy')}
        className={cn(
          'rounded-full px-2 py-1 font-medium transition-colors',
          isCanvasActive ? 'min-w-[42px] text-[12px]' : 'min-w-[38px] text-[11px] sm:min-w-[42px] sm:text-[12px]',
          locale === 'hy' ? 'bg-[#093394] text-white' : 'text-[#5b5b62]/80',
        )}
      >
        ՀԱՅ
      </button>
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={cn(
          'rounded-full px-2 py-1 font-medium transition-colors',
          isCanvasActive ? 'min-w-[42px] text-[12px]' : 'min-w-[38px] text-[11px] sm:min-w-[42px] sm:text-[12px]',
          locale === 'en' ? 'bg-[#093394] text-white' : 'text-[#5b5b62]/80',
        )}
      >
        EN
      </button>
    </div>
  );
}
