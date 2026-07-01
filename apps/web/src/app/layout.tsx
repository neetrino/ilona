import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './globals.css';
import { getSiteUrl, siteConfig } from '@/config/site';
import { DisableImageDrag } from '@/shared/components/DisableImageDrag';
import { WarmupRequest } from '@/shared/components/WarmupRequest';
import { LANDING_SCROLL_RESTORE_EARLY_SCRIPT } from '@/features/landing/landingScrollRestoreEarlyScript';

const inter = Inter({ subsets: ['latin'], preload: false });

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: siteConfig.name,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    locale: 'en_US',
    alternateLocale: ['hy_AM'],
  },
  twitter: {
    card: 'summary',
    title: siteConfig.name,
    description: siteConfig.description,
  },
  appleWebApp: {
    title: siteConfig.name,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // lang is synced client-side by ClientIntlProvider in the [locale] layout.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Script id="landing-scroll-restore" strategy="beforeInteractive">
          {LANDING_SCROLL_RESTORE_EARLY_SCRIPT}
        </Script>
        <DisableImageDrag />
        <WarmupRequest />
        {children}
      </body>
    </html>
  );
}


