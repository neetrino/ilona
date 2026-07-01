'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ChatBackButton } from '@/shared/components/ui/chat-back-button';
import { LandingNavbarLanguageToggle } from '@/shared/components/layout/LandingNavbarLanguageToggle';
import { StudentLogoutControl } from '@/shared/components/layout/StudentLogoutControl';
import { PortalHeaderSearch } from '@/features/search/components/PortalHeaderSearch';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMyDashboard } from '@/features/students';
import { isStudentPortalSubpage, isStudentProfilePath, stripLocaleFromPath } from '@/shared/lib/role-routes';
import { PORTAL_MOBILE_HEADER_ID } from '@/shared/lib/portal-mobile-layout';
import { cn } from '@/shared/lib/utils';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

type StudentDashboardHeaderProps = {
  pageTitle?: string;
  pageSubtitle?: string;
  onBack?: () => void;
  backLabel?: string;
};

export function StudentDashboardHeader({
  pageTitle,
  pageSubtitle,
  onBack,
  backLabel,
}: StudentDashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: dashboard } = useMyDashboard();
  const streak = dashboard?.statistics?.attendance?.currentStreak ?? 0;
  const level = dashboard?.student?.group?.level;
  const firstName = user?.firstName ?? tNav('user');
  const scrollToTop = () => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const isSubpage = Boolean(pageTitle);
  const normalizedPath = stripLocaleFromPath(pathname);
  const isStudentMobileSubpage = isStudentPortalSubpage(normalizedPath);
  const isProfilePage = isStudentProfilePath(normalizedPath);
  const shouldShowSecondaryRowOnMobile = !isStudentMobileSubpage;
  const resolvedBackLabel = backLabel ?? tCommon('back');

  return (
    <header
      id={PORTAL_MOBILE_HEADER_ID}
      className="shrink-0 bg-transparent px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.35rem,0.8vw,0.6rem)]"
    >
      <div className="w-full min-w-0 rounded-full border border-[rgba(14,14,16,0.07)] bg-white px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(0.55rem,1vw,0.9rem)] lg:rounded-[4rem]">
        <div className="flex flex-col gap-3 md:flex-row md:min-h-14 md:items-center md:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:self-stretch lg:items-stretch">
            <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-center lg:min-h-full lg:text-left">
              {isSubpage ? (
                <>
                  <div className="relative flex min-h-11 w-full items-center lg:block">
                    {onBack ? (
                      <ChatBackButton
                        onClick={onBack}
                        aria-label={resolvedBackLabel}
                        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 lg:static lg:shrink-0 lg:translate-y-0"
                      />
                    ) : null}
                    <h1 className="flex w-full min-h-11 items-center justify-center px-0 text-[1.125rem] font-bold leading-tight tracking-tight text-[#1010a3] sm:px-5 sm:text-[1.375rem] lg:min-h-0 lg:flex-1 lg:justify-start">
                      <button
                        type="button"
                        onClick={scrollToTop}
                        className={cn(
                          'max-w-full truncate border-0 bg-transparent p-0 text-inherit cursor-pointer sm:cursor-default',
                          isProfilePage && 'pr-[5.5rem] lg:pr-0',
                          onBack && 'px-10 lg:px-0',
                        )}
                      >
                        {pageTitle}
                      </button>
                    </h1>
                    {isProfilePage ? (
                      <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center lg:hidden">
                        <LandingNavbarLanguageToggle />
                      </div>
                    ) : null}
                  </div>
                  {pageSubtitle ? (
                    <p className="mt-1.5 line-clamp-2 text-xs text-[#8b8b90] sm:text-sm lg:text-left">
                      {pageSubtitle}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="truncate text-[0.625rem] tracking-wide text-[#8b8b90] sm:text-[0.6875rem] lg:text-left">
                    {t('greeting', { name: firstName })}
                  </p>
                  <h1 className="flex min-h-11 items-center justify-center px-0 text-[1.125rem] font-bold leading-tight tracking-tight sm:px-5 sm:text-[1.5rem] lg:min-h-0 lg:justify-start">
                    <button
                      type="button"
                      onClick={scrollToTop}
                      className="max-w-full truncate border-0 bg-transparent p-0 text-inherit cursor-pointer sm:cursor-default"
                    >
                      <span className="text-[#1010a3]">{t('titleMy')} </span>
                      <span className="font-normal text-[#5b5b62]">{t('titleLearning')}</span>
                    </button>
                  </h1>
                  {pageSubtitle ? (
                    <p className="mt-1.5 line-clamp-2 text-xs text-[#8b8b90] sm:text-sm lg:text-left">
                      {pageSubtitle}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div
            className={`min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 ${
              shouldShowSecondaryRowOnMobile ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="min-w-0 flex-1">
              <PortalHeaderSearch mobileSearchHandledExternally={isStudentMobileSubpage} />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <LandingNavbarLanguageToggle className="hidden lg:inline-flex" />
              <div className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full bg-[#ffeb8c] px-2.5 text-xs sm:h-12 sm:gap-1.5 sm:px-3.5 sm:text-sm">
                <PublicAssetImage
                  src={STUDENT_DASHBOARD_ASSETS.fireIcon}
                  alt=""
                  width={18}
                  height={18}
                  className="h-4 w-4 shrink-0 sm:h-5 sm:w-5"
                />
                <span className="whitespace-nowrap font-bold text-[#3a2f00]">{streak}</span>
                <span className="hidden whitespace-nowrap font-medium text-[#3a2f00] min-[420px]:inline">
                  {t('streak')}
                </span>
              </div>

              <StudentLogoutControl
                variant="header"
                roleDetail={level ?? undefined}
                className="hidden lg:inline-flex"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
