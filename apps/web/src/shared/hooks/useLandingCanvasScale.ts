'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getLandingCanvasMetrics,
  LANDING_CANVAS_MIN_WIDTH,
  LANDING_DESIGN_WIDTH,
} from '@/shared/lib/landing-layout';

type LandingCanvasMetrics = ReturnType<typeof getLandingCanvasMetrics>;

const DEFAULT_METRICS: LandingCanvasMetrics = {
  isCanvasActive: false,
  scale: 1,
};

export function useLandingCanvasScale(
  designWidth = LANDING_DESIGN_WIDTH,
  minWidth = LANDING_CANVAS_MIN_WIDTH,
) {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);

  const updateMetrics = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const isCanvasActive = viewportWidth >= minWidth;
    const scale = isCanvasActive ? viewportWidth / designWidth : 1;
    setMetrics({ isCanvasActive, scale });
  }, [designWidth, minWidth]);

  useEffect(() => {
    updateMetrics();
    window.addEventListener('resize', updateMetrics, { passive: true });
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics]);

  return metrics;
}
