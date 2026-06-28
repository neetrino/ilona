/** Horizontal padding shared by portal mobile home navbar and content. */
export const PORTAL_MOBILE_HORIZONTAL_PADDING = 'px-4';

/** Space below fixed portal mobile navbar (top-2 + pill height + gap). */
export const PORTAL_MOBILE_NAV_OFFSET = 'calc(0.5rem + 58px + 2rem)';

/** Tailwind class for scroll area padding above fixed portal mobile bottom nav. */
export const PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS =
  'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0';

/** Fixed portal mobile bottom nav sits above popup sheets (see sheet-stack). */
export const PORTAL_MOBILE_BOTTOM_NAV_Z_INDEX = 65;

export const PORTAL_CONTENT_SCROLL_ID = 'portal-content-scroll';
export const PORTAL_MOBILE_HEADER_ID = 'portal-mobile-header';
