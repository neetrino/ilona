'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getLandingCanvasMetrics,
  LANDING_CANVAS_MIN_WIDTH,
  LANDING_DESIGN_WIDTH,
} from '@/shared/lib/landing-layout';

type LandingCanvasMetrics = ReturnType<typeof getLandingCanvasMetrics>;

function readMetrics(
  designWidth: number,
  minWidth: number,
): LandingCanvasMetrics {
  if (typeof window === 'undefined') {
    return { isCanvasActive: false, scale: 1, offsetX: 0 };
  }

  return getLandingCanvasMetrics(window.innerWidth, designWidth, minWidth);
}

export function useLandingCanvasScale(
  designWidth = LANDING_DESIGN_WIDTH,
  minWidth = LANDING_CANVAS_MIN_WIDTH,
) {
  const [metrics, setMetrics] = useState(() => readMetrics(designWidth, minWidth));

  const updateMetrics = useCallback(() => {
    setMetrics(getLandingCanvasMetrics(window.innerWidth, designWidth, minWidth));
  }, [designWidth, minWidth]);

  useEffect(() => {
    updateMetrics();
    window.addEventListener('resize', updateMetrics, { passive: true });
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics]);

  return metrics;
}
