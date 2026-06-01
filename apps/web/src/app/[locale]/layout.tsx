import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, Locale } from '@/config/i18n';
import { QueryProvider } from '@/shared/lib/query-client';
import { ClientIntlProvider } from '@/shared/providers/ClientIntlProvider';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <ClientIntlProvider initialLocale={locale as Locale} initialMessages={messages}>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ClientIntlProvider>
  );
}
