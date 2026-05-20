import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, Locale } from '@/config/i18n';
import { QueryProvider } from '@/shared/lib/query-client';
import { SetLangAttribute } from '@/shared/components/SetLangAttribute';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface HomeLocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function HomeLocaleLayout({
  children,
  params,
}: HomeLocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <SetLangAttribute locale={locale as Locale} />
      <QueryProvider>{children}</QueryProvider>
    </NextIntlClientProvider>
  );
}
