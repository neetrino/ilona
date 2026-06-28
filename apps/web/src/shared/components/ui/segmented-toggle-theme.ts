export const SEGMENTED_TOGGLE_TRACK_PADDING_PX = 4;

export const SEGMENTED_TOGGLE_TRACK_CLASS =
  'relative inline-flex h-11 min-h-11 items-center rounded-[15px] border-2 border-[rgba(14,14,16,0.12)] bg-white p-1 shadow-sm';

export const SEGMENTED_TOGGLE_GRID_TRACK_CLASS =
  'relative grid h-11 min-h-11 items-stretch rounded-[15px] border-2 border-[rgba(14,14,16,0.12)] bg-white p-1 shadow-sm';

export const SEGMENTED_TOGGLE_INDICATOR_CLASS =
  'pointer-events-none absolute bottom-1 left-1 top-1 z-0 rounded-[11px] bg-[#1010a3] shadow-sm transition-[left,width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]';

export const SEGMENTED_TOGGLE_TWO_SEGMENT_WIDTH_CLASS = 'w-[calc(50%-0.25rem)]';

export const SEGMENTED_TOGGLE_BUTTON_CLASS =
  'relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-[11px] px-4 py-0 text-center text-sm font-semibold leading-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0 h-9';

export const SEGMENTED_TOGGLE_GRID_BUTTON_CLASS =
  'relative z-10 flex min-w-0 items-center justify-center rounded-[11px] px-4 py-0 text-center text-sm font-semibold leading-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0 h-full min-h-0';

export const SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS = 'text-white';

export const SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS = 'text-[#3b3b40] hover:bg-[#f6f6f7]';

export function getSegmentedIndicatorStyle(
  selectedIndex: number,
  optionCount: number,
  paddingPx = SEGMENTED_TOGGLE_TRACK_PADDING_PX,
): { top: number; bottom: number; left: string; width: string } {
  const segmentShare = 100 / optionCount;
  return {
    top: paddingPx,
    bottom: paddingPx,
    left: `calc(${selectedIndex * segmentShare}% + ${paddingPx}px)`,
    width: `calc(${segmentShare}% - ${paddingPx * 2}px)`,
  };
}
