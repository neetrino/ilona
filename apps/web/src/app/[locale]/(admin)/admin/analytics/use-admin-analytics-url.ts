'use client';

import { startTransition, useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  defaultCustomRangeSixMonths,
  toYmd,
  type TimeFilterMode,
} from '@/shared/lib/analytics-time-range';
import {
  getLiveSearchParams,
  readUrlSearchParam,
  replaceAppSearchParams,
} from '@/shared/lib/url-search-params';

export type AdminAnalyticsTab =
  | 'attendance'
  | 'payments'
  | 'recordings'
  | 'feedback'
  | 'risk';

const TAB_SET: ReadonlySet<string> = new Set([
  'attendance',
  'payments',
  'recordings',
  'feedback',
  'risk',
]);

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidYmd(s: string): boolean {
  if (!YMD_RE.test(s)) return false;
  const t = new Date(`${s}T12:00:00`);
  return !Number.isNaN(t.getTime());
}

function parseYmdParam(v: string | null, fallback: string): string {
  if (v && isValidYmd(v)) return v;
  return fallback;
}

function parseTab(v: string | null): AdminAnalyticsTab {
  if (v && TAB_SET.has(v)) return v as AdminAnalyticsTab;
  return 'attendance';
}

function getDefaultPaymentsTimeMode(): TimeFilterMode {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches) {
    return 'day';
  }
  return 'date';
}

export function useAdminAnalyticsUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [urlRevision, setUrlRevision] = useState(0);
  const defRange = useMemo(() => defaultCustomRangeSixMonths(), []);
  const todayYmd = useMemo(() => toYmd(new Date()), []);

  const activeTab = useMemo(
    () => parseTab(readUrlSearchParam('tab', searchParams)),
    [searchParams, urlRevision],
  );

  const timeMode = useMemo(
    () => {
      const modeFromUrl = readUrlSearchParam('pm', searchParams);
      if (modeFromUrl === 'day' || modeFromUrl === 'week' || modeFromUrl === 'date') {
        return modeFromUrl;
      }
      return getDefaultPaymentsTimeMode();
    },
    [searchParams, urlRevision],
  );

  const dayYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('pd', searchParams), todayYmd),
    [searchParams, todayYmd, urlRevision],
  );

  const weekAnchorYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('pw', searchParams), todayYmd),
    [searchParams, todayYmd, urlRevision],
  );

  const customFromYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('cfrom', searchParams), defRange.fromYmd),
    [searchParams, defRange.fromYmd, urlRevision],
  );

  const customToYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('cto', searchParams), defRange.toYmd),
    [searchParams, defRange.toYmd, urlRevision],
  );

  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = getLiveSearchParams(searchParams);
      mutate(params);
      startTransition(() => {
        replaceAppSearchParams({
          router,
          pathname,
          params,
          scroll: false,
          onReplaced: () => setUrlRevision((revision) => revision + 1),
        });
      });
    },
    [pathname, router, searchParams],
  );

  const setActiveTab = useCallback(
    (tab: AdminAnalyticsTab) => {
      updateParams((p) => {
        if (tab === 'attendance') {
          p.delete('tab');
        } else {
          p.set('tab', tab);
        }
      });
    },
    [updateParams],
  );

  const setTimeMode = useCallback(
    (mode: TimeFilterMode) => {
      updateParams((p) => {
        p.set('pm', mode);
      });
    },
    [updateParams],
  );

  const setDayYmd = useCallback(
    (v: string) => {
      updateParams((p) => {
        if (isValidYmd(v)) p.set('pd', v);
      });
    },
    [updateParams],
  );

  const setWeekAnchorYmd = useCallback(
    (v: string) => {
      updateParams((p) => {
        if (isValidYmd(v)) p.set('pw', v);
      });
    },
    [updateParams],
  );

  const setCustomFromYmd = useCallback(
    (v: string) => {
      updateParams((p) => {
        if (isValidYmd(v)) p.set('cfrom', v);
      });
    },
    [updateParams],
  );

  const setCustomToYmd = useCallback(
    (v: string) => {
      updateParams((p) => {
        if (isValidYmd(v)) p.set('cto', v);
      });
    },
    [updateParams],
  );

  const applyPaymentsTimeFilter = useCallback(
    (state: {
      timeMode: TimeFilterMode;
      dayYmd: string;
      weekAnchorYmd: string;
      customFromYmd: string;
      customToYmd: string;
    }) => {
      updateParams((p) => {
        p.set('pm', state.timeMode);
        if (isValidYmd(state.dayYmd)) p.set('pd', state.dayYmd);
        if (isValidYmd(state.weekAnchorYmd)) p.set('pw', state.weekAnchorYmd);
        if (isValidYmd(state.customFromYmd)) p.set('cfrom', state.customFromYmd);
        if (isValidYmd(state.customToYmd)) p.set('cto', state.customToYmd);
      });
    },
    [updateParams],
  );

  return {
    activeTab,
    setActiveTab,
    timeMode,
    setTimeMode,
    dayYmd,
    setDayYmd,
    weekAnchorYmd,
    setWeekAnchorYmd,
    customFromYmd,
    setCustomFromYmd,
    customToYmd,
    setCustomToYmd,
    applyPaymentsTimeFilter,
  };
}
