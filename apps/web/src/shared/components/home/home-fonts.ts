import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google';

export const bricolageDisplay = Bricolage_Grotesque({
  weight: ['700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage-home',
});

export const dmSansHome = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-home',
});

export const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jb-home',
});

export const homeFontClassName = `${bricolageDisplay.variable} ${dmSansHome.variable} ${jetbrainsMono.variable} ${dmSansHome.className} font-sans antialiased`;
