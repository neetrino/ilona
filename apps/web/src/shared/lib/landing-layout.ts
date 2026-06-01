/** Figma desktop artboard width for the landing page canvas scaler. */
export const LANDING_DESIGN_WIDTH = 1440;

/** Viewports below this width use the real mobile layout (no canvas scaling). */
export const LANDING_CANVAS_MIN_WIDTH = 744;

/** Max content width for the landing navbar within the design canvas. */
export const LANDING_NAVBAR_MAX_WIDTH = 1280;

/** Navbar bar height in the 1440px Figma canvas (scaled on tablet+). */
export const LANDING_NAVBAR_HEIGHT = 70;

/** Inline nav from this width; below it uses the burger menu (covers all iPad sizes). */
export const LANDING_NAV_DESKTOP_MIN_WIDTH = 1367;

export function getLandingCanvasMetrics(
  viewportWidth: number,
  designWidth = LANDING_DESIGN_WIDTH,
  minWidth = LANDING_CANVAS_MIN_WIDTH,
) {
  const isCanvasActive = viewportWidth >= minWidth;

  if (!isCanvasActive) {
    return { isCanvasActive, scale: 1, offsetX: 0 };
  }

  const scale = Math.min(viewportWidth / designWidth, 1);
  const scaledWidth = designWidth * scale;
  const offsetX = Math.max((viewportWidth - scaledWidth) / 2, 0);

  return { isCanvasActive, scale, offsetX };
}
