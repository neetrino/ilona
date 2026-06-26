const SITE_NAME = 'Ilona English Center';
const SITE_DESCRIPTION = 'English Learning Center Management Platform';

export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  return new URL(raw);
}

export const siteConfig = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
} as const;
