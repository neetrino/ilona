'use client';

import { useCallback, useMemo } from 'react';
import {
  defaultCustomRangeSixMonths,
  toYmd,
  type TimeFilterMode,
} from '@/shared/lib/analytics-time-range';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';

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
  const { searchParams, urlRevision, replaceParams, replaceAllParams } = useAppSearchUrl();
  const defRange = useMemo(() => defaultCustomRangeSixMonths(), []);
  const todayYmd = useMemo(() => toYmd(new Date()), []);

  const activeTab = useMemo(
    () => parseTab(readUrlSearchParam('tab', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const timeMode = useMemo(() => {
    const modeFromUrl = readUrlSearchParam('pm', searchParams, urlRevision);
    if (modeFromUrl === 'day' || modeFromUrl === 'week' || modeFromUrl === 'date') {
      return modeFromUrl;
    }
    return getDefaultPaymentsTimeMode();
  }, [searchParams, urlRevision]);

  const dayYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('pd', searchParams, urlRevision), todayYmd),
    [searchParams, todayYmd, urlRevision],
  );

  const weekAnchorYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('pw', searchParams, urlRevision), todayYmd),
    [searchParams, todayYmd, urlRevision],
  );

  const customFromYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('cfrom', searchParams, urlRevision), defRange.fromYmd),
    [searchParams, defRange.fromYmd, urlRevision],
  );

  const customToYmd = useMemo(
    () => parseYmdParam(readUrlSearchParam('cto', searchParams, urlRevision), defRange.toYmd),
    [searchParams, defRange.toYmd, urlRevision],
  );

  const setActiveTab = useCallback(
    (tab: AdminAnalyticsTab) => {
      replaceParams({ tab: tab === 'attendance' ? null : tab });
    },
    [replaceParams],
  );

  const setTimeMode = useCallback(
    (mode: TimeFilterMode) => {
      replaceAllParams((params) => {
        params.set('pm', mode);
      });
    },
    [replaceAllParams],
  );

  const setDayYmd = useCallback(
    (v: string) => {
      replaceAllParams((params) => {
        if (isValidYmd(v)) params.set('pd', v);
      });
    },
    [replaceAllParams],
  );

  const setWeekAnchorYmd = useCallback(
    (v: string) => {
      replaceAllParams((params) => {
        if (isValidYmd(v)) params.set('pw', v);
      });
    },
    [replaceAllParams],
  );

  const setCustomFromYmd = useCallback(
    (v: string) => {
      replaceAllParams((params) => {
        if (isValidYmd(v)) params.set('cfrom', v);
      });
    },
    [replaceAllParams],
  );

  const setCustomToYmd = useCallback(
    (v: string) => {
      replaceAllParams((params) => {
        if (isValidYmd(v)) params.set('cto', v);
      });
    },
    [replaceAllParams],
  );

  const applyPaymentsTimeFilter = useCallback(
    (state: {
      timeMode: TimeFilterMode;
      dayYmd: string;
      weekAnchorYmd: string;
      customFromYmd: string;
      customToYmd: string;
    }) => {
      replaceAllParams((params) => {
        params.set('pm', state.timeMode);
        if (isValidYmd(state.dayYmd)) params.set('pd', state.dayYmd);
        if (isValidYmd(state.weekAnchorYmd)) params.set('pw', state.weekAnchorYmd);
        if (isValidYmd(state.customFromYmd)) params.set('cfrom', state.customFromYmd);
        if (isValidYmd(state.customToYmd)) params.set('cto', state.customToYmd);
      });
    },
    [replaceAllParams],
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
