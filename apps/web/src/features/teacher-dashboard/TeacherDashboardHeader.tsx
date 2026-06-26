'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { StudentLogoutControl } from '@/shared/components/layout/StudentLogoutControl';
import { PortalHeaderSearch } from '@/features/search/components/PortalHeaderSearch';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { isTeacherPortalSubpage } from '@/shared/lib/role-routes';
import { PORTAL_MOBILE_HEADER_ID } from '@/shared/lib/portal-mobile-layout';

type TeacherDashboardHeaderProps = {
  pageTitle?: string;
  pageSubtitle?: string;
};

export function TeacherDashboardHeader({
  pageTitle,
  pageSubtitle,
}: TeacherDashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const firstName = user?.firstName ?? tNav('user');
  const scrollToTop = () => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const isSubpage = Boolean(pageTitle);
  const isTeacherMobileSubpage = isTeacherPortalSubpage(pathname.replace(/^\/[a-z]{2}\//, '/'));
  const shouldShowSecondaryRowOnMobile = !isTeacherMobileSubpage;

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
                  <h1 className="flex min-h-11 items-center justify-center px-0 text-[1.125rem] font-bold leading-tight tracking-tight text-[#1010a3] sm:px-5 sm:text-[1.375rem] lg:min-h-0 lg:flex-1 lg:justify-start">
                    <button
                      type="button"
                      onClick={scrollToTop}
                      className="max-w-full truncate border-0 bg-transparent p-0 text-inherit cursor-pointer sm:cursor-default"
                    >
                      {pageTitle}
                    </button>
                  </h1>
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
                      <span className="font-normal text-[#5b5b62]">{t('titleTeaching')}</span>
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
              <PortalHeaderSearch mobileSearchHandledExternally={isTeacherMobileSubpage} />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <StudentLogoutControl variant="header" className="hidden lg:inline-flex" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
