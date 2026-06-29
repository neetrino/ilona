import { MOBILE_BODY_PORTAL_MAX_WIDTH } from './single-select-dropdown.constants';
import type { MenuPosition } from './single-select-dropdown.types';

export function shouldPortalMenuToBody(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BODY_PORTAL_MAX_WIDTH;
}

export function resolvePortalContainer(root: HTMLElement | null): HTMLElement {
  if (!root) return document.body;
  const dialog = root.closest('[role="dialog"]');
  return (dialog as HTMLElement | null) ?? document.body;
}

interface ComputeMenuPositionInput {
  trigger: HTMLElement;
  root: HTMLElement | null;
  searchable: boolean;
  menuMinWidth?: number;
}

export interface ComputeMenuPositionResult {
  menuPosition: MenuPosition;
  portalContainer: HTMLElement;
  openUpward: boolean;
}

export function computeMenuPosition({
  trigger,
  root,
  searchable,
  menuMinWidth,
}: ComputeMenuPositionInput): ComputeMenuPositionResult {
  const portalContainer = shouldPortalMenuToBody()
    ? document.body
    : resolvePortalContainer(root);
  const useDialogPortal = !shouldPortalMenuToBody() && portalContainer !== document.body;

  const rect = trigger.getBoundingClientRect();
  const menuWidth = menuMinWidth ? Math.max(rect.width, menuMinWidth) : rect.width;
  let menuLeft = menuMinWidth && menuWidth > rect.width ? rect.right - menuWidth : rect.left;
  const viewportPadding = 12;
  if (menuMinWidth) {
    menuLeft = Math.max(
      viewportPadding,
      Math.min(menuLeft, window.innerWidth - menuWidth - viewportPadding),
    );
  }
  const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
  const spaceAbove = rect.top - viewportPadding;
  const searchInputHeight = searchable ? 52 : 0;
  const shouldOpenUpward = useDialogPortal
    ? spaceBelow < 220 + searchInputHeight || (spaceAbove > spaceBelow && spaceBelow < 280)
    : spaceBelow < 220 + searchInputHeight && spaceAbove > spaceBelow;
  const availableSpace = Math.max(120, shouldOpenUpward ? spaceAbove : spaceBelow);
  const maxHeight = Math.min(320 + searchInputHeight, Math.floor(availableSpace));

  if (useDialogPortal) {
    const dialogRect = portalContainer.getBoundingClientRect();
    return {
      portalContainer,
      openUpward: shouldOpenUpward,
      menuPosition: {
        positionMode: 'absolute',
        left: rect.left - dialogRect.left + (menuLeft - rect.left),
        width: menuWidth,
        maxHeight,
        ...(shouldOpenUpward
          ? { bottom: dialogRect.bottom - rect.top + 6 }
          : { top: rect.bottom - dialogRect.top + 6 }),
      },
    };
  }

  return {
    portalContainer,
    openUpward: shouldOpenUpward,
    menuPosition: {
      positionMode: 'fixed',
      left: menuLeft,
      width: menuWidth,
      maxHeight,
      ...(shouldOpenUpward
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    },
  };
}
