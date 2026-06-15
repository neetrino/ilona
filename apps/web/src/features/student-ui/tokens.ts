/** Design tokens aligned with the Student Dashboard (Figma). */
export const studentColors = {
  primary: '#1010a3',
  muted: '#8b8b90',
  body: '#3b3b40',
  surface: '#fafafa',
  track: '#f1f1f2',
  shell: '#ececec',
} as const;

export {
  portalCardClass as studentCardClass,
  portalInnerCardClass as studentInnerCardClass,
  portalPageStackClass as studentPageStackClass,
  portalSectionTitleClass as studentSectionTitleClass,
  portalSectionSubtitleClass as studentSectionSubtitleClass,
} from '@/shared/lib/portal-responsive';

export const studentLabelClass = 'mb-1.5 block text-xs font-medium tracking-wide text-[#8b8b90]';

export const studentInputClass =
  'h-11 w-full min-w-0 rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-white px-4 text-[16px] text-[#3b3b40] transition-colors placeholder:text-[#8b8b90] hover:border-[rgba(14,14,16,0.12)] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15 lg:text-sm';

export const studentSelectClass = studentInputClass;

export const studentPrimaryButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#1010a3] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

export const studentSecondaryButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#d9d9f4] px-5 text-sm font-semibold text-[#1010a3] transition-colors hover:bg-[#c9c9ef] disabled:cursor-not-allowed disabled:opacity-50';

export const studentGhostButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[rgba(14,14,16,0.07)] bg-white px-4 text-sm font-medium text-[#3b3b40] transition-colors hover:bg-[#f6f6f7]';

export const studentIconButtonClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] text-[#3b3b40] transition-colors hover:bg-[#f6f6f7]';

export const studentTableHeadClass =
  'bg-[#f6f6f7] text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-[#8b8b90]';

export const studentTableRowHoverClass = 'transition-colors hover:bg-[#fafafa]';

export const studentPillTrackClass =
  'inline-flex flex-wrap items-center gap-1 rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] p-1';

export const studentPillActiveClass =
  'rounded-full bg-[#1010a3] px-3 py-1 text-[0.6875rem] font-medium text-white';

export const studentPillInactiveClass =
  'rounded-full px-3 py-1 text-[0.6875rem] font-medium text-[#3b3b40] transition-colors hover:text-[#1010a3]';

export const studentSpinnerClass =
  'h-10 w-10 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]';

export const studentScheduleBoardClass =
  'flex min-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white md:min-h-[min(75vh,36rem)] lg:h-[calc(100vh-260px)] lg:min-h-0';

/** Schedule lesson grid (week/month) when variant=student */
export const studentScheduleTable = {
  border: 'border-[rgba(14,14,16,0.07)]',
  headBg: 'bg-[#f6f6f7]',
  headText: 'text-[#8b8b90]',
  cellText: 'text-[#8b8b90]',
  emptyText: 'text-[#8b8b90]',
  futureCard: 'border-[#b8b8f0] bg-[#ddecff]',
  defaultCard: 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]',
  mutedCard: 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7]',
  lessonTitle: 'text-[#1010a3]',
  lessonMeta: 'text-[#8b8b90]',
  lessonSub: 'text-[#3b3b40]',
} as const;
