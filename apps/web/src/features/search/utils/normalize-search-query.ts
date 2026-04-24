/** Align with API `normalizeSearchQuery`: trim + collapse internal whitespace. */
export function normalizeSearchQuery(raw: string | undefined | null): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}
