import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>{children}</body>
    </html>
  );
}


