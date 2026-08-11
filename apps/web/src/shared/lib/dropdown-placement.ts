export interface DropdownDirection {
  openUpward: boolean;
  maxHeight: number;
}

export interface FixedDropdownPlacement extends DropdownDirection {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

export function getDropdownDirection(
  triggerRect: DOMRect,
  estimatedMenuHeight: number,
  viewportPadding = 12,
): DropdownDirection {
  const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
  const spaceAbove = triggerRect.top - viewportPadding;
  const openUpward = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
  const maxHeight = Math.min(
    estimatedMenuHeight,
    Math.max(120, openUpward ? spaceAbove : spaceBelow),
  );
  return { openUpward, maxHeight };
}

export function getFixedDropdownPlacement(
  triggerRect: DOMRect,
  menuWidth: number,
  estimatedMenuHeight: number,
  viewportPadding = 12,
): FixedDropdownPlacement {
  const { openUpward, maxHeight } = getDropdownDirection(
    triggerRect,
    estimatedMenuHeight,
    viewportPadding,
  );

  let left = triggerRect.right - menuWidth;
  left = Math.max(
    viewportPadding,
    Math.min(left, window.innerWidth - menuWidth - viewportPadding),
  );

  if (openUpward) {
    return {
      openUpward: true,
      bottom: window.innerHeight - triggerRect.top + 4,
      left,
      width: menuWidth,
      maxHeight,
    };
  }

  return {
    openUpward: false,
    top: triggerRect.bottom + 4,
    left,
    width: menuWidth,
    maxHeight,
  };
}
