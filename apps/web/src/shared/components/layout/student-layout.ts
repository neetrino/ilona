/** Shared layout tokens for student/teacher portal shells (sidebar, main, header). */
export const STUDENT_SHELL_BG = 'bg-[#ececec]';

export const STUDENT_MAIN_PADDING =
  'px-3 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8';

/** Breakpoint where the docked sidebar is shown (matches Tailwind `lg`). */
export const STUDENT_SIDEBAR_DESKTOP_CLASS = 'hidden lg:flex shrink-0';

export const STUDENT_MOBILE_NAV_WIDTH = 'min(18.5rem,88vw)';

/** Aliases for teacher portal (same visual system as student). */
export const PORTAL_SHELL_BG = STUDENT_SHELL_BG;
export const PORTAL_MAIN_PADDING = STUDENT_MAIN_PADDING;
export const PORTAL_SIDEBAR_DESKTOP_CLASS = STUDENT_SIDEBAR_DESKTOP_CLASS;
export const PORTAL_MOBILE_NAV_WIDTH = STUDENT_MOBILE_NAV_WIDTH;
