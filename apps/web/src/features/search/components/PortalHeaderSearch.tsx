'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GlobalSearchBar } from './GlobalSearchBar';
import { PortalMobileSearchSheet } from './PortalMobileSearchSheet';

const SEARCH_INPUT_CLASS =
  'h-11 rounded-[2.125rem] border-transparent bg-[#f3f3f4] lg:h-12';

type PortalHeaderSearchProps = {
  /** Bottom nav handles mobile search — hide header trigger on mobile. */
  mobileSearchHandledExternally?: boolean;
};

export function PortalHeaderSearch({
  mobileSearchHandledExternally = false,
}: PortalHeaderSearchProps) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const showMobileTrigger = !mobileSearchHandledExternally;

  return (
    <div className="min-w-0 w-full">
      {showMobileTrigger ? (
        <button
          type="button"
          className="flex h-11 w-full min-w-0 items-center gap-2.5 rounded-[2.125rem] bg-[#f3f3f4] px-4 text-left text-[16px] text-[#8b8b90] lg:hidden"
          onClick={() => setSheetOpen(true)}
          aria-label={t('globalSearch')}
        >
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="truncate">{t('globalSearch')}</span>
        </button>
      ) : null}

      <div className="hidden min-w-0 lg:block">
        <GlobalSearchBar className="w-full max-w-none" inputClassName={SEARCH_INPUT_CLASS} />
      </div>

      {showMobileTrigger ? (
        <PortalMobileSearchSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      ) : null}
    </div>
  );
}
