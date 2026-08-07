/** Portal design tokens (Student / Teacher / Admin dashboards). */
export {
  portalCardClass,
  portalInnerCardClass,
  portalPageStackClass,
  portalSectionTitleClass,
  portalSectionSubtitleClass,
  portalFilterBarClass,
  portalFilterActionsClass,
  portalToolbarClass,
  portalTableScrollClass,
  portalKanbanScrollClass,
  portalKanbanColumnClass,
  portalStatsGridClass,
  portalStatsGrid2Class,
  portalFilterGridClass,
  portalFilterGridDenseClass,
  portalSelectMinClass,
} from '@/shared/lib/portal-responsive';

export {
  studentLabelClass as portalLabelClass,
  studentInputClass as portalInputClass,
  studentSelectClass as portalSelectClass,
  studentPrimaryButtonClass as portalPrimaryButtonClass,
  studentSecondaryButtonClass as portalSecondaryButtonClass,
  studentGhostButtonClass as portalGhostButtonClass,
  studentIconButtonClass as portalIconButtonClass,
  studentTableHeadClass as portalTableHeadClass,
  studentTableRowHoverClass as portalTableRowHoverClass,
  studentPillTrackClass as portalPillTrackClass,
  studentPillActiveClass as portalPillActiveClass,
  studentPillInactiveClass as portalPillInactiveClass,
  studentColors as portalColors,
} from '@/features/student-ui/tokens';

export const portalTableChromeClass =
  'overflow-hidden rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white';

export const portalTableHeadRowClass = 'border-b border-[rgba(14,14,16,0.07)]';

export const portalTableHeadCellClass =
  'text-left text-[0.6875rem] font-semibold uppercase tracking-wider text-[#8b8b90]';

export const portalTableBodyClass = 'divide-y divide-[rgba(14,14,16,0.07)]';

export const portalTableRowClass = 'transition-colors hover:bg-[#fafafa]';

export const portalEmptyTextClass = 'text-sm text-[#8b8b90]';
