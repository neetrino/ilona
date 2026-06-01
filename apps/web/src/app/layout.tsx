import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DisableImageDrag } from '@/shared/components/DisableImageDrag';
import { WarmupRequest } from '@/shared/components/WarmupRequest';

const inter = Inter({ subsets: ['latin'], preload: false });

export const metadata: Metadata = {
  title: 'Ilona English Center',
  description: 'English Learning Center Management Platform',
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
        <DisableImageDrag />
        <WarmupRequest />
        {children}
      </body>
    </html>
  );
}


