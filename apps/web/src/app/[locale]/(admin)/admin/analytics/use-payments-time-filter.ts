'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TimeFilterMode } from '@/shared/lib/analytics-time-range';
import { useAdminAnalyticsUrl } from './use-admin-analytics-url';

export type AdminPaymentsTimeFilter = {
  timeMode: TimeFilterMode;
  dayYmd: string;
  weekAnchorYmd: string;
  customFromYmd: string;
  customToYmd: string;
};

function isSameTimeFilter(
  a: AdminPaymentsTimeFilter,
  b: AdminPaymentsTimeFilter
): boolean {
  return (
    a.timeMode === b.timeMode &&
    a.dayYmd === b.dayYmd &&
    a.weekAnchorYmd === b.weekAnchorYmd &&
    a.customFromYmd === b.customFromYmd &&
    a.customToYmd === b.customToYmd
  );
}

type AdminAnalyticsUrlValue = ReturnType<typeof useAdminAnalyticsUrl>;

export function useAdminPaymentsTimeFilter(
  u: AdminAnalyticsUrlValue
): {
  committed: AdminPaymentsTimeFilter;
  hasUnsavedChanges: boolean;
  onApply: () => void;
  timeFilterBarProps: {
    mode: TimeFilterMode;
    onModeChange: (m: TimeFilterMode) => void;
    dayYmd: string;
    onDayYmdChange: (v: string) => void;
    weekAnchorYmd: string;
    onWeekAnchorYmdChange: (v: string) => void;
    customFromYmd: string;
    customToYmd: string;
    onCustomFromYmd: (v: string) => void;
    onCustomToYmd: (v: string) => void;
  };
} {
  const { timeMode, dayYmd, weekAnchorYmd, customFromYmd, customToYmd, applyPaymentsTimeFilter } = u;

  const [draft, setDraft] = useState<AdminPaymentsTimeFilter>(() => ({
    timeMode: u.timeMode,
    dayYmd: u.dayYmd,
    weekAnchorYmd: u.weekAnchorYmd,
    customFromYmd: u.customFromYmd,
    customToYmd: u.customToYmd,
  }));

  const [committed, setCommitted] = useState<AdminPaymentsTimeFilter>(() => ({
    timeMode: u.timeMode,
    dayYmd: u.dayYmd,
    weekAnchorYmd: u.weekAnchorYmd,
    customFromYmd: u.customFromYmd,
    customToYmd: u.customToYmd,
  }));

  useEffect(() => {
    setDraft({ timeMode, dayYmd, weekAnchorYmd, customFromYmd, customToYmd });
    setCommitted({ timeMode, dayYmd, weekAnchorYmd, customFromYmd, customToYmd });
  }, [timeMode, dayYmd, weekAnchorYmd, customFromYmd, customToYmd]);

  const hasUnsavedChanges = !isSameTimeFilter(draft, committed);

  const onApply = useCallback(() => {
    setCommitted(draft);
    applyPaymentsTimeFilter(draft);
  }, [draft, applyPaymentsTimeFilter]);

  const onModeChange = useCallback((m: TimeFilterMode) => {
    setDraft((d) => ({ ...d, timeMode: m }));
  }, []);

  const onDayYmdChange = useCallback((v: string) => {
    setDraft((d) => ({ ...d, dayYmd: v }));
  }, []);

  const onWeekAnchorYmdChange = useCallback((v: string) => {
    setDraft((d) => ({ ...d, weekAnchorYmd: v }));
  }, []);

  const onCustomFromYmd = useCallback((v: string) => {
    setDraft((d) => ({ ...d, customFromYmd: v }));
  }, []);

  const onCustomToYmd = useCallback((v: string) => {
    setDraft((d) => ({ ...d, customToYmd: v }));
  }, []);

  const timeFilterBarProps = useMemo(
    () => ({
      mode: draft.timeMode,
      onModeChange,
      dayYmd: draft.dayYmd,
      onDayYmdChange,
      weekAnchorYmd: draft.weekAnchorYmd,
      onWeekAnchorYmdChange,
      customFromYmd: draft.customFromYmd,
      customToYmd: draft.customToYmd,
      onCustomFromYmd,
      onCustomToYmd,
    }),
    [draft, onModeChange, onDayYmdChange, onWeekAnchorYmdChange, onCustomFromYmd, onCustomToYmd]
  );

  return { committed, hasUnsavedChanges, onApply, timeFilterBarProps };
}
