import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
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

/** Keep backdrop darkness from the first sheet when stacking additional layers. */
export const STACKED_SHEET_OVERLAY_DIM_SUPPRESS_CLASS = '!bg-transparent';

let openLayerCount = 0;

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

function isForeignPortalSheetTarget(target: Element, currentLayer: HTMLElement): boolean {
  const foreignDialog = target.closest('[role="dialog"]');
  if (
    foreignDialog instanceof HTMLElement &&
    foreignDialog !== currentLayer &&
    !currentLayer.contains(foreignDialog)
  ) {
    return true;
  }

  const foreignLayer = target.closest(`[${PORTAL_SHEET_LAYER_ATTR}]`);
  if (
    foreignLayer instanceof HTMLElement &&
    foreignLayer !== currentLayer &&
    !currentLayer.contains(foreignLayer)
  ) {
    return true;
  }

  let node: Element | null = target;
  while (node && node !== currentLayer) {
    if (node instanceof HTMLElement && isViewportOverlay(node) && !currentLayer.contains(node)) {
      return true;
    }
    node = node.parentElement;
  }

  return false;
}

export function preventStackedSheetDismiss(event: Event): void {
  const target = event.target;
  if (target instanceof Element) {
    if (
      target.closest(`[${SINGLE_SELECT_DROPDOWN_MENU_ATTR}]`) ||
      target.closest(`[${SINGLE_SELECT_DROPDOWN_BACKDROP_ATTR}]`) ||
      target.closest(`[${DATE_PICKER_POPOVER_ATTR}]`)
    ) {
      event.preventDefault();
      return;
    }
  }

  const current = event.currentTarget;
  if (!(current instanceof HTMLElement)) return;

  if (target instanceof Element && isForeignPortalSheetTarget(target, current)) {
    event.preventDefault();
    return;
  }

  const active = document.activeElement;
  if (active instanceof Element && active !== current) {
    if (isForeignPortalSheetTarget(active, current)) {
      event.preventDefault();
    }
  }
}

export const stackedSheetDialogHandlers = {
  onPointerDownOutside: preventStackedSheetDismiss,
  onInteractOutside: preventStackedSheetDismiss,
  onFocusOutside: preventStackedSheetDismiss,
};

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

  useEffect(() => {
    if (!active) {
      setLayer(null);
      return;
    }

    openLayerCount += 1;
    const acquiredLayer = openLayerCount;
    setLayer(acquiredLayer);

    return () => {
      openLayerCount = Math.max(0, openLayerCount - 1);
      setLayer(null);
    };
  }, [active]);

  const overlayZIndex = layer !== null ? BASE_Z_INDEX + layer * LAYER_STEP : BASE_Z_INDEX;
  const contentZIndex = overlayZIndex + 1;
  const isBaseLayer = layer === null || layer === 1;

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
