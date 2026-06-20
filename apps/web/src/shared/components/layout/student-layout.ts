/** Shared layout tokens for student/teacher portal shells (sidebar, main, header). */
export const STUDENT_SHELL_BG = 'bg-[#ececec]';

export const STUDENT_MAIN_PADDING =
  'px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.75rem,1.5vw,1.25rem)]';

/** Breakpoint where the docked sidebar is shown (matches Tailwind `lg`). */
export const STUDENT_SIDEBAR_DESKTOP_CLASS = 'hidden lg:flex shrink-0';

export const STUDENT_MOBILE_NAV_WIDTH = 'min(18.5rem,88vw)';

/** Aliases for teacher portal (same visual system as student). */
export const PORTAL_SHELL_BG = STUDENT_SHELL_BG;
export const PORTAL_MAIN_PADDING = STUDENT_MAIN_PADDING;
export const PORTAL_SIDEBAR_DESKTOP_CLASS = STUDENT_SIDEBAR_DESKTOP_CLASS;
export const PORTAL_MOBILE_NAV_WIDTH = STUDENT_MOBILE_NAV_WIDTH;

/** Horizontal gap between nav icon and label (gap-1 + 7px). */
export const PORTAL_SIDEBAR_NAV_ITEM_GAP_CLASS = 'gap-[11px]';

export const PORTAL_SIDEBAR_WIDTH_CLASS = {
  default: 'w-[clamp(12.5rem,15vw,18rem)]',
  hy: 'w-[clamp(16rem,20vw,23rem)]',
  hyIpad: 'w-[clamp(17rem,21vw,24.5rem)]',
  collapsed: 'w-[4.5rem]',
} as const;

/** Extra label styles for longer Armenian nav copy. */
export const PORTAL_SIDEBAR_NAV_LABEL_HY_CLASS = 'text-[0.8125rem] leading-tight break-words';

export function getPortalSidebarWidthClass(
  collapsed: boolean,
  isArmenianLocale: boolean,
  isIPad: boolean,
): string {
  if (collapsed) return PORTAL_SIDEBAR_WIDTH_CLASS.collapsed;
  if (isArmenianLocale) {
    return isIPad ? PORTAL_SIDEBAR_WIDTH_CLASS.hyIpad : PORTAL_SIDEBAR_WIDTH_CLASS.hy;
  }
  return PORTAL_SIDEBAR_WIDTH_CLASS.default;
}
