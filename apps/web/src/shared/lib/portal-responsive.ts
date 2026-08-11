/**
 * Shared responsive layout utilities for Student / Teacher / Admin portal pages.
 * Prefer these over one-off fixed widths so sections scale down without overlapping.
 */

/** Vertical stack for page content */
export const portalPageStackClass =
  'flex w-full min-w-0 flex-col gap-[clamp(0.875rem,1.5vw,1.5rem)]';

/** Primary surface card */
export const portalCardClass =
  'rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white p-[clamp(0.875rem,1.75vw,1.5rem)] sm:rounded-3xl';

/** Dashboard aside card — matches Today’s lessons shell; use with fillHeight in a flex column */
export const portalDashboardAsideCardClass =
  'rounded-3xl border border-[rgba(14,14,16,0.07)] p-5 sm:p-6';

/** Inner nested card */
export const portalInnerCardClass =
  'rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-[clamp(0.75rem,1.5vw,1rem)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_22px_rgba(14,14,16,0.07)]';

export const portalSectionTitleClass =
  'text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]';

export const portalSectionSubtitleClass =
  'mt-1 text-[clamp(0.6875rem,1vw,0.75rem)] text-[#8b8b90]';

/** Filter / toolbar row: stacks on mobile, wraps on desktop */
export const portalFilterBarClass =
  'flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end';

/** Trailing actions (view toggle, primary CTA) */
export const portalFilterActionsClass =
  'flex w-full min-w-0 flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:shrink-0';

/** Page toolbar (title area + actions) */
export const portalToolbarClass =
  'flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between';

/** Horizontally scrollable table region (no page-level overflow) */
export const portalTableScrollClass =
  'w-full min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]';

/** Horizontally scrollable kanban / board columns */
export const portalKanbanScrollClass =
  'w-full min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]';

/** Kanban column shell */
export const portalKanbanColumnClass =
  'flex w-[clamp(14rem,42vw,20rem)] shrink-0 flex-col rounded-xl border border-[rgba(14,14,16,0.07)] bg-[#fafafa]';

/** Stats metric grid (1 → 2 → 3 → 4 cols) */
export const portalStatsGridClass =
  'grid w-full min-w-0 grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.5rem)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

/** Two-column stats / content grid */
export const portalStatsGrid2Class =
  'grid w-full min-w-0 grid-cols-1 gap-[clamp(0.75rem,1.5vw,1.5rem)] lg:grid-cols-2';

/** Filter field grid (auto-fit columns) */
export const portalFilterGridClass =
  'grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))]';

/** Compact filter grid for dense filter bars (students, recordings) */
export const portalFilterGridDenseClass =
  'grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))]';

/** Min-width helper for selects — grows on small screens, caps on large */
export const portalSelectMinClass = 'min-w-0 w-full sm:min-w-[9rem] sm:w-auto';
