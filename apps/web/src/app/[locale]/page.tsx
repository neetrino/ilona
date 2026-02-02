import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          {t('title')}
        </h1>
        <p className="text-xl text-center text-muted-foreground mb-12">
          {t('subtitle')}
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/en/login"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </main>
  );
}


