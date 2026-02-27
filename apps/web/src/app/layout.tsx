import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
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
  // Note: The lang attribute will be set dynamically by SetLangAttribute component
  // in the [locale] layout, so we use a default here
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WarmupRequest />
        {children}
      </body>
    </html>
  );
}


