import {
  DESKTOP_MIN_WIDTH,
  ESTIMATED_POPOVER_HEIGHT,
  EXPANDED_POPOVER_WIDTH,
  MOBILE_POPOVER_WIDTH,
  POPOVER_GAP,
  VIEWPORT_PADDING,
} from './date-picker-input.constants';
import type { PopoverPosition } from './date-picker-input.types';
import { resolvePortalContainer } from './date-picker-input.util';

interface ComputePopoverPositionParams {
  root: HTMLDivElement;
  popoverElement: HTMLDivElement | null;
  popoverExpanded: boolean;
}

export function computePopoverPosition({
  root,
  popoverElement,
  popoverExpanded,
}: ComputePopoverPositionParams): {
  position: PopoverPosition;
  portalContainer: HTMLElement;
} | null {
  const anchor =
    root.querySelector<HTMLElement>('[data-date-anchor]') ??
    root.querySelector<HTMLElement>('[data-role="date-trigger"]');
  if (!anchor) return null;

  const portalContainer = resolvePortalContainer(root);
  const useDialogPortal = portalContainer !== document.body;
  const isDesktop = window.innerWidth >= DESKTOP_MIN_WIDTH;
  const anchorRect = anchor.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const popoverHeight = popoverElement?.offsetHeight ?? ESTIMATED_POPOVER_HEIGHT;
  const popoverWidth = popoverExpanded
    ? Math.min(EXPANDED_POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2)
    : isDesktop
      ? root.offsetWidth
      : Math.min(MOBILE_POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
  const matchFormWidth = !popoverExpanded && isDesktop;

  const spaceBelow = window.innerHeight - anchorRect.bottom - VIEWPORT_PADDING;
  const spaceAbove = anchorRect.top - VIEWPORT_PADDING;
  const openBelow = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove;
  const placement: PopoverPosition['placement'] = openBelow ? 'below' : 'above';

  if (useDialogPortal) {
    const dialogRect = portalContainer.getBoundingClientRect();
    const anchorLeft = isDesktop && !popoverExpanded ? rootRect.left : anchorRect.left;
    let left = anchorLeft - dialogRect.left;
    const maxLeft = portalContainer.clientWidth - popoverWidth - VIEWPORT_PADDING;
    left = Math.max(VIEWPORT_PADDING, Math.min(left, maxLeft));

    const top = openBelow
      ? anchorRect.bottom - dialogRect.top + POPOVER_GAP
      : Math.max(
          VIEWPORT_PADDING,
          anchorRect.top - dialogRect.top - popoverHeight - POPOVER_GAP,
        );

    return {
      portalContainer,
      position: {
        left,
        top,
        width: popoverWidth,
        placement,
        matchFormWidth,
        positionMode: 'absolute',
      },
    };
  }

  let left = isDesktop && !popoverExpanded ? rootRect.left : anchorRect.left;
  if (left + popoverWidth > window.innerWidth - VIEWPORT_PADDING) {
    left = Math.max(VIEWPORT_PADDING, window.innerWidth - popoverWidth - VIEWPORT_PADDING);
  }
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  }

  const top = openBelow
    ? anchorRect.bottom + POPOVER_GAP
    : Math.max(VIEWPORT_PADDING, anchorRect.top - popoverHeight - POPOVER_GAP);

  return {
    portalContainer,
    position: {
      left,
      top,
      width: popoverWidth,
      placement,
      matchFormWidth,
      positionMode: 'fixed',
    },
  };
}
