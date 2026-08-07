'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { GlobalSearchResult, GlobalSearchResultType } from '../types/search.types';
import {
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  Mic,
  Search,
  Users,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatAppDateTime } from '@/shared/lib/app-timezone';
import { normalizeSearchQuery } from '../utils/normalize-search-query';
import {
  DROPDOWN_MENU_SURFACE_CLASS,
  DROPDOWN_OPTION_BASE_CLASS,
  DROPDOWN_OPTION_INTERACTIVE_CLASS,
} from '@/shared/components/ui/dropdown-theme';

function iconForType(type: GlobalSearchResultType): ReactNode {
  const className = 'w-4 h-4 text-slate-500 flex-shrink-0';
  switch (type) {
    case 'student':
      return <UserCircle className={className} aria-hidden />;
    case 'teacher':
      return <UserCircle className={className} aria-hidden />;
    case 'group':
      return <Users className={className} aria-hidden />;
    case 'crm_lead':
      return <Briefcase className={className} aria-hidden />;
    case 'lesson':
      return <Calendar className={className} aria-hidden />;
    case 'payment':
      return <CreditCard className={className} aria-hidden />;
    case 'recording':
      return <Mic className={className} aria-hidden />;
    case 'daily_plan':
      return <FileText className={className} aria-hidden />;
    case 'page':
      return <LayoutDashboard className={className} aria-hidden />;
    default:
      return <Search className={className} aria-hidden />;
  }
}

function formatMaybeDate(iso: string | undefined, locale: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return formatAppDateTime(d, locale);
}

export type GlobalSearchDropdownProps = {
  open: boolean;
  query: string;
  debouncedQuery: string;
  results: GlobalSearchResult[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  onPick: (item: GlobalSearchResult) => void;
  minCharsHint: string;
  loadingLabel: string;
  emptyLabel: string;
  errorLabel: string;
  retryLabel: string;
  getBadgeLabel: (item: GlobalSearchResult) => string;
  getTitle: (item: GlobalSearchResult) => string;
  placement?: 'below' | 'above';
  maxHeightPx?: number;
};

export function GlobalSearchDropdown({
  open,
  query,
  debouncedQuery,
  results,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onPick,
  minCharsHint,
  loadingLabel,
  emptyLabel,
  errorLabel,
  retryLabel,
  getBadgeLabel,
  getTitle,
  placement = 'below',
  maxHeightPx,
}: GlobalSearchDropdownProps) {
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const trimmed = normalizeSearchQuery(query);

  // Do not show an empty dropdown panel before user starts typing.
  if (!open || trimmed.length === 0) {
    return null;
  }

  const debouncedOk = normalizeSearchQuery(debouncedQuery).length >= 2;

  return (
    <div
      className={cn(
        DROPDOWN_MENU_SURFACE_CLASS,
        placement === 'above'
          ? 'bottom-full mb-1 max-h-[min(50vh,320px)]'
          : 'top-full mt-1 max-h-[min(52vh,320px)] sm:max-h-[min(70vh,420px)]',
        'overscroll-contain py-1 touch-pan-y [-webkit-overflow-scrolling:touch]',
      )}
      style={maxHeightPx ? { maxHeight: `${maxHeightPx}px` } : undefined}
      role="listbox"
      aria-label={tCommon('searchResults')}
    >
      {trimmed.length > 0 && trimmed.length < 2 ? (
        <p className="px-3 py-2 text-xs text-slate-500">{minCharsHint}</p>
      ) : null}

      {trimmed.length >= 2 && !debouncedOk ? (
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          {loadingLabel}
        </div>
      ) : null}

      {debouncedOk && isLoading ? (
        <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          {loadingLabel}
        </div>
      ) : null}

      {debouncedOk && isError ? (
        <div className="px-3 py-2">
          <p className="text-sm text-red-600">{errorLabel}</p>
          {errorMessage ? <p className="mt-1 text-xs text-slate-500">{errorMessage}</p> : null}
          <button
            type="button"
            className="mt-2 text-xs font-medium text-emerald-600 hover:underline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRetry}
          >
            {retryLabel}
          </button>
        </div>
      ) : null}

      {debouncedOk && !isLoading && !isError && results && results.length === 0 ? (
        <p className="px-3 py-3 text-sm text-slate-500">{emptyLabel}</p>
      ) : null}

      {debouncedOk && !isLoading && !isError && results && results.length > 0
        ? results.map((item) => {
            const title = getTitle(item);
            const dateLine = formatMaybeDate(item.description, locale);
            return (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                role="option"
                aria-selected={false}
                className={cn(
                  DROPDOWN_OPTION_BASE_CLASS,
                  DROPDOWN_OPTION_INTERACTIVE_CLASS,
                  'flex items-start gap-2',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(item)}
              >
                <span className="mt-0.5">{iconForType(item.type)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-slate-800">{title}</span>
                    <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                      {getBadgeLabel(item)}
                    </span>
                  </span>
                  {item.subtitle ? (
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span>
                  ) : null}
                  {dateLine ? <span className="mt-0.5 block text-xs text-slate-400">{dateLine}</span> : null}
                </span>
              </button>
            );
          })
        : null}

      {/* TODO: ArrowDown / ArrowUp / Enter keyboard selection — click navigation is implemented first. */}
    </div>
  );
}
