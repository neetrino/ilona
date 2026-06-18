'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { StudentLogoutControl } from '@/shared/components/layout/StudentLogoutControl';
import { PortalHeaderSearch } from '@/features/search/components/PortalHeaderSearch';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { isAdminPortalSubpage } from '@/shared/lib/role-routes';

type AdminDashboardHeaderProps = {
  pageTitle?: string;
  pageSubtitle?: string;
  headerContent?: React.ReactNode;
  onMenuClick?: () => void;
};

export function AdminDashboardHeader({
  pageTitle,
  pageSubtitle,
  headerContent,
  onMenuClick,
}: AdminDashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const firstName = user?.firstName ?? tNav('user');
  const isSubpage = Boolean(pageTitle);
  const isAdminMobileSubpage = isAdminPortalSubpage(
    pathname.replace(/^\/[a-z]{2}\//, '/'),
    user?.role,
  );
  const shouldShowSecondaryRowOnMobile = !isAdminMobileSubpage || Boolean(headerContent);
  return (
    <header className="sticky top-0 z-40 shrink-0 bg-transparent px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.35rem,0.8vw,0.6rem)] md:static">
      <div className="w-full min-w-0 rounded-full border border-[rgba(14,14,16,0.07)] bg-white px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(0.55rem,1vw,0.9rem)] lg:rounded-[4rem]">
        <div className="flex flex-col gap-3 md:flex-row md:min-h-14 md:items-center md:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {onMenuClick ? (
              <button
                type="button"
                onClick={onMenuClick}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#1010a3] hover:bg-[#f6f6f7] lg:hidden"
                aria-label="Open navigation menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            ) : null}

            <div className="min-w-0 flex-1 text-center lg:text-left flex min-h-11 flex-col justify-center">
              {isSubpage ? (
                <>
                  <h1 className="flex h-11 items-center justify-center truncate px-0 text-[1.125rem] font-bold leading-none tracking-tight text-[#1010a3] sm:block sm:h-auto sm:px-5 sm:text-[1.375rem] sm:leading-tight">
                    {pageTitle}
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
                  <h1 className="flex h-11 items-center justify-center truncate px-0 text-[1.125rem] font-bold leading-none tracking-tight text-[#1010a3] sm:block sm:h-auto sm:px-5 sm:text-[1.5rem] sm:leading-tight">
                    {t('title')}
                  </h1>
                </>
              )}
            </div>
            {onMenuClick ? <div className="h-11 w-11 shrink-0 lg:hidden" aria-hidden /> : null}
          </div>

          <div
            className={`min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 ${
              shouldShowSecondaryRowOnMobile ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="min-w-0 flex-1">
              <PortalHeaderSearch mobileSearchHandledExternally={isAdminMobileSubpage} />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              {headerContent}

              <StudentLogoutControl variant="header" className="hidden lg:inline-flex" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
