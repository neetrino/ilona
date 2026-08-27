export const LANDING_NAV_ITEMS = [
  { id: 'home', href: '/' },
  { id: 'about', href: '/' },
  { id: 'courses', href: '/' },
  { id: 'teachers', href: '/' },
  { id: 'branches', href: '/' },
  { id: 'contact', href: '/' },
  { id: 'blog', href: '/blog' },
] as const;

export type LandingNavSectionId = (typeof LANDING_NAV_ITEMS)[number]['id'];

export const LANDING_NAV_SECTION_IDS = LANDING_NAV_ITEMS.map((item) => item.id);

/** Matches Tailwind `scroll-mt-28` — clears the fixed landing navbar. */
export const LANDING_SECTION_SCROLL_MARGIN_CLASS = 'scroll-mt-28';

export const LANDING_HEADER_SCROLL_OFFSET = 112;
