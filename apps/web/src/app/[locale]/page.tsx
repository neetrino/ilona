'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';

export default function HomePage() {
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      const dashboardPath = getDashboardPath(user.role);
      router.replace(`/${locale}${dashboardPath}`);
    }
  }, [isAuthenticated, isHydrated, user, locale, router]);

  // Show loading while checking auth
  if (!isHydrated || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/95 backdrop-blur-md shadow-sm/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm transition-transform hover:scale-105">
                <span className="text-xl text-primary-foreground font-bold">I</span>
              </div>
              <span className="text-xl font-bold text-slate-900 hidden sm:inline tracking-tight">
                {t('title')}
              </span>
            </Link>

            {/* Right side: Language switcher + Auth buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <LanguageSwitcher />
              <div className="hidden sm:flex items-center gap-2.5">
                <Button
                  variant="ghost"
                  asChild
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200"
                >
                  <Link href={`/${locale}/login`}>{t('signIn')}</Link>
                </Button>
                <Button 
                  asChild
                  className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                >
                  <Link href={`/${locale}/register`}>{t('signUp')}</Link>
                </Button>
              </div>
              {/* Mobile: Single button */}
              <Button asChild size="sm" className="sm:hidden transition-all duration-200">
                <Link href={`/${locale}/login`}>{t('signIn')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-8 leading-[1.1] tracking-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('heroDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              asChild 
              className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] font-medium"
            >
              <Link href={`/${locale}/register`}>
                {t('signUp')}
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base px-8 py-6 border-2 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 font-medium"
            >
              <Link href={`/${locale}/login`}>{t('signIn')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 tracking-tight">
              {t('featuresTitle')}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('feature1Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('feature1Description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-amber-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('feature2Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('feature2Description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('feature3Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('feature3Description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('feature4Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('feature4Description')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('feature5Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('feature5Description')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 bg-rose-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('feature6Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('feature6Description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 tracking-tight">
              {t('howItWorksTitle')}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {t('howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-14">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-primary-foreground shadow-md transition-transform hover:scale-110 duration-300">
                1
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('step1Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('step1Description')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-primary-foreground shadow-md transition-transform hover:scale-110 duration-300">
                2
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('step2Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('step2Description')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-primary-foreground shadow-md transition-transform hover:scale-110 duration-300">
                3
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                {t('step3Title')}
              </h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {t('step3Description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center bg-primary rounded-3xl p-10 sm:p-14 text-primary-foreground shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-5 tracking-tight">
            {t('heroTitle')}
          </h2>
          <p className="text-lg mb-10 opacity-95 leading-relaxed">
            {t('heroDescription')}
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            asChild 
            className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] font-medium"
          >
            <Link href={`/${locale}/register`}>
              {t('getStarted')}
              <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center">
            <p className="text-sm text-slate-600 text-center">
              {t('footerCopyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
