/**
 * Normalizes a user search string for DB and quick-page matching:
 * - trims leading/trailing whitespace
 * - collapses any run of whitespace (spaces, tabs, newlines) to a single space
 *
 * Prisma `contains` + `mode: 'insensitive'` handles case; normalization fixes
 * multi-space queries not matching single-spaced stored values (e.g. "ani   hakobyan" vs "Ani Hakobyan").
 */
export function normalizeSearchQuery(raw: string | undefined | null): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}

/** Tokens after normalization (split on single spaces). */
export function searchTokensFromNormalized(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(' ').filter((t) => t.length > 0);
}
