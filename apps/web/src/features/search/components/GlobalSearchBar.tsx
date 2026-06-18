'use client';

import { useCallback, useEffect, useRef, useState, startTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Input } from '@/shared/components/ui/input';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { GlobalSearchDropdown } from './GlobalSearchDropdown';
import type { GlobalSearchResult, GlobalSearchResultType } from '../types/search.types';
import { getErrorMessage } from '@/shared/lib/api';
import { isGlobalSearchPageNavKey } from '../nav-keys';
import { normalizeSearchQuery } from '../utils/normalize-search-query';
import { cn } from '@/shared/lib/utils';
import { useOutsidePress } from '@/shared/hooks/useOutsidePress';

const DEBOUNCE_MS = 300;

/** iOS Safari zooms inputs below 16px — keep 16px until desktop sidebar (`lg`). */
const GLOBAL_SEARCH_INPUT_FONT_CLASS = 'text-[16px] lg:text-sm';

type GlobalSearchBarProps = {
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  dropdownPlacement?: 'below' | 'above';
  onNavigate?: () => void;
};

const TYPE_KEYS: Record<GlobalSearchResultType, string> = {
  student: 'searchTypeStudent',
  teacher: 'searchTypeTeacher',
  group: 'searchTypeGroup',
  crm_lead: 'searchTypeCrm',
  lesson: 'searchTypeLesson',
  payment: 'searchTypePayment',
  recording: 'searchTypeRecording',
  page: 'searchTypePage',
};

export function GlobalSearchBar({
  className,
  inputClassName,
  autoFocus = false,
  dropdownPlacement = 'below',
  onNavigate,
}: GlobalSearchBarProps = {}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownMaxHeightPx, setDropdownMaxHeightPx] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  const tNav = useTranslations('nav');

  useEffect(() => {
    if (!autoFocus) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      setOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(normalizeSearchQuery(query));
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isError, error, refetch } = useGlobalSearch(debouncedQuery, open);

  useOutsidePress(containerRef, () => setOpen(false), { enabled: open });

  useEffect(() => {
    if (!open || dropdownPlacement !== 'below') {
      setDropdownMaxHeightPx(undefined);
      return;
    }

    const updateDropdownMaxHeight = () => {
      const inputEl = inputRef.current;
      if (!inputEl) return;

      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const inputBottom = inputEl.getBoundingClientRect().bottom;
      const availableHeight = Math.max(120, Math.floor(viewportHeight - inputBottom - 12));

      setDropdownMaxHeightPx((current) =>
        current === availableHeight ? current : availableHeight,
      );
    };

    updateDropdownMaxHeight();

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', updateDropdownMaxHeight);
    visualViewport?.addEventListener('scroll', updateDropdownMaxHeight);
    window.addEventListener('resize', updateDropdownMaxHeight);

    return () => {
      visualViewport?.removeEventListener('resize', updateDropdownMaxHeight);
      visualViewport?.removeEventListener('scroll', updateDropdownMaxHeight);
      window.removeEventListener('resize', updateDropdownMaxHeight);
    };
  }, [open, dropdownPlacement]);

  const navigateTo = useCallback(
    (href: string) => {
      const path = href.startsWith('/') ? href : `/${href}`;
      router.push(`/${locale}${path}`);
      setOpen(false);
      setQuery('');
      setDebouncedQuery('');
      onNavigate?.();
    },
    [locale, onNavigate, router],
  );

  const onPick = useCallback(
    (item: GlobalSearchResult) => {
      navigateTo(item.href);
    },
    [navigateTo],
  );

  const getBadgeLabel = useCallback((item: GlobalSearchResult) => t(TYPE_KEYS[item.type]), [t]);

  const getTitle = useCallback(
    (item: GlobalSearchResult) => {
      if (item.type === 'page') {
        const raw = item.metadata?.navKey;
        if (typeof raw === 'string' && isGlobalSearchPageNavKey(raw)) {
          return tNav(raw);
        }
      }
      return item.title;
    },
    [tNav],
  );

  return (
    <div ref={containerRef} className={cn('relative w-64 min-w-0', className)}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <Input
        ref={inputRef}
        type="search"
        placeholder={t('globalSearch')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        className={cn(
          'w-full min-w-0 border-slate-200 bg-slate-50 pl-10 focus:bg-white',
          GLOBAL_SEARCH_INPUT_FONT_CLASS,
          inputClassName,
        )}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      <GlobalSearchDropdown
        open={open}
        query={query}
        debouncedQuery={debouncedQuery}
        results={data}
        isLoading={isLoading}
        isError={isError}
        errorMessage={isError ? getErrorMessage(error) : undefined}
        onRetry={() => void refetch()}
        onPick={onPick}
        minCharsHint={t('globalSearchMinChars')}
        loadingLabel={t('globalSearchLoading')}
        emptyLabel={t('globalSearchEmpty')}
        errorLabel={t('globalSearchError')}
        retryLabel={t('retry')}
        getBadgeLabel={getBadgeLabel}
        getTitle={getTitle}
        placement={dropdownPlacement}
        maxHeightPx={dropdownMaxHeightPx}
      />
    </div>
  );
}
