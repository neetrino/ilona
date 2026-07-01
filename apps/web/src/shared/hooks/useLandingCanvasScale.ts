'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  getLandingCanvasMetrics,
  LANDING_CANVAS_MIN_WIDTH,
  LANDING_DESIGN_WIDTH,
} from '@/shared/lib/landing-layout';

type LandingCanvasMetrics = ReturnType<typeof getLandingCanvasMetrics>;

/** Matches SSR HTML so hydration succeeds; real metrics apply before first paint. */
const INITIAL_METRICS: LandingCanvasMetrics = { isCanvasActive: false, scale: 1 };

export function useLandingCanvasScale(
  designWidth = LANDING_DESIGN_WIDTH,
  minWidth = LANDING_CANVAS_MIN_WIDTH,
) {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const updateMetrics = useCallback(() => {
    setMetrics(getLandingCanvasMetrics(window.innerWidth, designWidth, minWidth));
  }, [designWidth, minWidth]);

  useLayoutEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  useEffect(() => {
    window.addEventListener('resize', updateMetrics, { passive: true });
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics]);

  return metrics;
}
