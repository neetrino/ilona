export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DESKTOP_MIN_WIDTH = 1367;
/** Comfortable width so weekday labels (MON–SUN) never collide. */
export const MIN_POPOVER_WIDTH = 300;
export const MOBILE_POPOVER_WIDTH = 300;
export const EXPANDED_POPOVER_WIDTH = 320;
export const MOBILE_CALENDAR_BACKDROP_Z_CLASS = 'z-[9998]';
export const MOBILE_CALENDAR_Z_CLASS = 'z-[9999]';
export const ESTIMATED_POPOVER_HEIGHT = 390;
export const VIEWPORT_PADDING = 8;
export const POPOVER_GAP = 6;

export const DATE_PICKER_POPOVER_ATTR = 'data-date-picker-popover';

export const MANUAL_DATE_FORMATS = ['dd/MM/yyyy', 'd/M/yyyy', 'dd/MM/yy', 'd/M/yy', 'yyyy-MM-dd'] as const;
