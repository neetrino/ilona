/** Shared Student sidebar icon sizing — Dashboard (26×26) is the reference for all nav items */

export const STUDENT_SIDEBAR_ICON_SLOT_PX = 26;
export const STUDENT_SIDEBAR_ICON_ACTIVE_INNER_PX = 19;

/** Fixed slot for inactive icons and active pill wrapper */
export const STUDENT_SIDEBAR_ICON_SLOT_CLASS =
  'flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center';

export const STUDENT_SIDEBAR_ICON_ACTIVE_PILL_CLASS =
  `${STUDENT_SIDEBAR_ICON_SLOT_CLASS} rounded-[1rem] bg-white`;

export const STUDENT_SIDEBAR_ICON_INACTIVE_MASK_CLASS =
  'inline-block bg-[#7777C9] [-webkit-mask-image:var(--icon-mask)] [mask-image:var(--icon-mask)] [-webkit-mask-position:center] [mask-position:center] [-webkit-mask-repeat:no-repeat] [mask-repeat:no-repeat] [-webkit-mask-size:contain] [mask-size:contain]';

export const STUDENT_SIDEBAR_ICON_ACTIVE_INNER_CLASS =
  'h-[1.1875rem] w-[1.1875rem] object-contain object-center';

/** Scale content to fit inside a square slot without cropping */
export function scaleToFitSquareSlot(
  slotPx: number,
  contentWidth: number,
  contentHeight: number,
): number {
  return Math.min(slotPx / contentWidth, slotPx / contentHeight);
}
