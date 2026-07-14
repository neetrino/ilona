'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useDailyPlan } from './hooks';
import type { DailyPlan } from './types';

export const DAILY_PLAN_VIEW_PARAM = 'planId';

export function useDailyPlanViewSheet(items: DailyPlan[]) {
  const { readParam, setParams, removeParams } = useAppSearchUrl();
  const planIdFromUrl = readParam(DAILY_PLAN_VIEW_PARAM);

  const planFromList = useMemo(() => {
    if (!planIdFromUrl) {
      return null;
    }
    return items.find((plan) => plan.id === planIdFromUrl) ?? null;
  }, [items, planIdFromUrl]);

  const needsFetch = Boolean(planIdFromUrl) && !planFromList;
  const { data: fetchedPlan, isError } = useDailyPlan(
    needsFetch ? (planIdFromUrl ?? undefined) : undefined,
  );

  const viewing = planIdFromUrl ? (planFromList ?? fetchedPlan ?? null) : null;

  useEffect(() => {
    if (needsFetch && isError && planIdFromUrl) {
      removeParams([DAILY_PLAN_VIEW_PARAM]);
    }
  }, [isError, needsFetch, planIdFromUrl, removeParams]);

  const openView = useCallback(
    (plan: DailyPlan) => {
      setParams({ [DAILY_PLAN_VIEW_PARAM]: plan.id });
    },
    [setParams],
  );

  const closeView = useCallback(() => {
    removeParams([DAILY_PLAN_VIEW_PARAM]);
  }, [removeParams]);

  return { viewing, openView, closeView };
}
