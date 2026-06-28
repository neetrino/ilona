export interface FixedDropdownPlacement {
  openUpward: boolean;
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

export function getFixedDropdownPlacement(
  triggerRect: DOMRect,
  menuWidth: number,
  estimatedMenuHeight: number,
  viewportPadding = 12,
): FixedDropdownPlacement {
  const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
  const spaceAbove = triggerRect.top - viewportPadding;
  const openUpward = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
  const maxHeight = Math.min(
    estimatedMenuHeight,
    Math.max(120, openUpward ? spaceAbove : spaceBelow),
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
