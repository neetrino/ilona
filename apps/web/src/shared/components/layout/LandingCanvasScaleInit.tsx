'use client';

import { useLayoutEffect } from 'react';
import { LANDING_CANVAS_MIN_WIDTH, LANDING_DESIGN_WIDTH } from '@/shared/lib/landing-layout';

function syncLandingCanvasScale() {
  const width = window.innerWidth;

  if (width >= LANDING_CANVAS_MIN_WIDTH) {
    document.documentElement.style.setProperty(
      '--landing-canvas-scale',
      String(width / LANDING_DESIGN_WIDTH),
    );
    document.documentElement.classList.add('landing-canvas-active');
    return;
  }

  document.documentElement.classList.remove('landing-canvas-active');
  document.documentElement.style.removeProperty('--landing-canvas-scale');
}

/** Keeps the landing canvas CSS variable in sync on resize after hydration. */
export function LandingCanvasScaleRuntime() {
  useLayoutEffect(() => {
    syncLandingCanvasScale();
    window.addEventListener('resize', syncLandingCanvasScale, { passive: true });
    return () => window.removeEventListener('resize', syncLandingCanvasScale);
  }, []);

  return null;
}
