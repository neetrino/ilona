import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { PORTAL_MOBILE_BOTTOM_NAV_Z_INDEX } from '@/shared/lib/portal-mobile-layout';
import { cn } from '@/shared/lib/utils';

export const PORTAL_SHEET_LAYER_ATTR = 'data-portal-sheet-layer';

export const portalSheetLayerProps = {
  [PORTAL_SHEET_LAYER_ATTR]: '',
} as const;

const SINGLE_SELECT_DROPDOWN_MENU_ATTR = 'data-single-select-dropdown-menu';
const SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR = 'data-single-select-dropdown-backdrop';
const DATE_PICKER_POPOVER_ATTR = 'data-date-picker-popover';

const BASE_Z_INDEX = 50;
const LAYER_STEP = 20;
const MOBILE_SHEET_LAYER_STEP = 4;
const MOBILE_SHEET_MEDIA_QUERY = '(max-width: 1366px)';
const MOBILE_SHEET_MAX_CONTENT_Z_INDEX = PORTAL_MOBILE_BOTTOM_NAV_Z_INDEX - 1;

/** Keep backdrop darkness from the first sheet when stacking additional layers. */
export const STACKED_SHEET_OVERLAY_DIM_SUPPRESS_CLASS = '!bg-transparent';

let openLayerCount = 0;
const stackListeners = new Set<() => void>();

function notifyStackChange(): void {
  stackListeners.forEach((listener) => listener());
}

function subscribeStackChange(listener: () => void): () => void {
  stackListeners.add(listener);
  return () => stackListeners.delete(listener);
}

export function stackedSheetOverlayClassName(
  baseClassName: string,
  isBaseLayer: boolean,
  extraClassName?: string,
): string {
  return cn(baseClassName, !isBaseLayer && STACKED_SHEET_OVERLAY_DIM_SUPPRESS_CLASS, extraClassName);
}

function isViewportOverlay(element: HTMLElement): boolean {
  if (element.getAttribute('data-state') !== 'open') return false;
  const style = window.getComputedStyle(element);
  if (style.position !== 'fixed') return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.width >= window.innerWidth * 0.9 &&
    rect.height >= window.innerHeight * 0.9
  );
}

/**
 * Radix dispatches outside events on the clicked node (`event.target`), not on
 * Dialog.Content. Overlay clicks must dismiss; only interactions with another
 * sheet/dialog content (or portaled menus) should be blocked.
 */
function shouldPreventOutsideDismiss(target: Element): boolean {
  if (
    target.closest(`[${SINGLE_SELECT_DROPDOWN_MENU_ATTR}]`) ||
    target.closest(`[${SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR}]`) ||
    target.closest(`[${DATE_PICKER_POPOVER_ATTR}]`)
  ) {
    return true;
  }

  // Own (or any) full-viewport overlay is a valid dismiss target.
  if (target instanceof HTMLElement && isViewportOverlay(target)) {
    return false;
  }

  const foreignDialog = target.closest('[role="dialog"]');
  if (foreignDialog instanceof HTMLElement) {
    return true;
  }

  const foreignLayer = target.closest(`[${PORTAL_SHEET_LAYER_ATTR}]`);
  if (foreignLayer instanceof HTMLElement && !isViewportOverlay(foreignLayer)) {
    return true;
  }

  return false;
}

export function preventStackedSheetDismiss(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (shouldPreventOutsideDismiss(target)) {
    event.preventDefault();
  }
}

export const stackedSheetDialogHandlers = {
  onPointerDownOutside: preventStackedSheetDismiss,
  onInteractOutside: preventStackedSheetDismiss,
  onFocusOutside: preventStackedSheetDismiss,
};

function useMobileSheetViewport(): boolean {
  const [isMobileSheet, setIsMobileSheet] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_SHEET_MEDIA_QUERY);
    const sync = () => setIsMobileSheet(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return isMobileSheet;
}

function resolveSheetStackZIndexes(
  layer: number | null,
  isMobileSheet: boolean,
): { overlayZIndex: number; contentZIndex: number } {
  const layerStep = isMobileSheet ? MOBILE_SHEET_LAYER_STEP : LAYER_STEP;
  const rawOverlayZIndex = layer !== null ? BASE_Z_INDEX + layer * layerStep : BASE_Z_INDEX;
  const rawContentZIndex = rawOverlayZIndex + 1;

  if (!isMobileSheet) {
    return { overlayZIndex: rawOverlayZIndex, contentZIndex: rawContentZIndex };
  }

  return {
    overlayZIndex: Math.min(rawOverlayZIndex, MOBILE_SHEET_MAX_CONTENT_Z_INDEX - 1),
    contentZIndex: Math.min(rawContentZIndex, MOBILE_SHEET_MAX_CONTENT_Z_INDEX),
  };
}

export function useSheetStackZIndex(active: boolean): {
  layer: number | null;
  isBaseLayer: boolean;
  overlayZIndex: number;
  contentZIndex: number;
  overlayStyle: CSSProperties;
  contentStyle: CSSProperties;
  overlayDimClassName: string | undefined;
} {
  const [layer, setLayer] = useState<number | null>(null);
  const [, setStackRevision] = useState(0);
  const isMobileSheet = useMobileSheetViewport();

  useEffect(() => subscribeStackChange(() => setStackRevision((revision) => revision + 1)), []);

  useEffect(() => {
    if (!active) {
      setLayer(null);
      return;
    }

    openLayerCount += 1;
    const acquiredLayer = openLayerCount;
    setLayer(acquiredLayer);
    notifyStackChange();

    return () => {
      openLayerCount = Math.max(0, openLayerCount - 1);
      setLayer(null);
      notifyStackChange();
    };
  }, [active]);

  const { overlayZIndex, contentZIndex } = resolveSheetStackZIndexes(layer, isMobileSheet);
  // Dim only the bottom sheet when stacked. If upper layers close (e.g. details → edit),
  // the remaining sheet must dim again even when it acquired a higher layer number.
  const isBaseLayer = layer === null || layer === 1 || openLayerCount === 1;

  return {
    layer,
    isBaseLayer,
    overlayZIndex,
    contentZIndex,
    overlayStyle: { zIndex: overlayZIndex },
    contentStyle: { zIndex: contentZIndex },
    overlayDimClassName: isBaseLayer ? undefined : STACKED_SHEET_OVERLAY_DIM_SUPPRESS_CLASS,
  };
}
