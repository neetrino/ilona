/**
 * Avatar-adjacent "SUB" badge — same size/placement/typography as Students "NEW", violet fill.
 */
export function TeacherSubstituteBadge() {
  return (
    <span
      className="pointer-events-none absolute -left-3 top-[14%] inline-flex -translate-y-1/2 -rotate-12 items-center rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] bg-violet-600 text-white shadow-sm"
      aria-label="Substitute teaching"
    >
      SUB
    </span>
  );
}

/** Inline "SUB" chip in breakdown rows — same type scale as NEW, violet fill. */
export const substituteLessonChipClassName =
  'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em] bg-violet-600 text-white shadow-sm';
