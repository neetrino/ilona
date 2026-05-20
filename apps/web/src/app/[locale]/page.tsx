import { redirect } from 'next/navigation';
import { locales, Locale } from '@/config/i18n';

interface LocaleRootPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleRootPage({ params }: LocaleRootPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    redirect('/home/en');
  }

  redirect(`/home/${locale}`);
}
