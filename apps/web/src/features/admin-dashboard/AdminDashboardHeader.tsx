'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ChatBackButton } from '@/shared/components/ui/chat-back-button';
import { LandingNavbarLanguageToggle } from '@/shared/components/layout/LandingNavbarLanguageToggle';
import { StudentLogoutControl } from '@/shared/components/layout/StudentLogoutControl';
import { PortalHeaderSearch } from '@/features/search/components/PortalHeaderSearch';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { isAdminPortalSubpage } from '@/shared/lib/role-routes';
import { PORTAL_MOBILE_HEADER_ID } from '@/shared/lib/portal-mobile-layout';
import { cn } from '@/shared/lib/utils';

type AdminDashboardHeaderProps = {
  pageTitle?: string;
  pageSubtitle?: string;
  headerContent?: React.ReactNode;
  onMenuClick?: () => void;
  onBack?: () => void;
  backLabel?: string;
};

export function AdminDashboardHeader({
  pageTitle,
  pageSubtitle,
  headerContent,
  onMenuClick,
  onBack,
  backLabel,
}: AdminDashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const { user } = useAuthStore();
  const scrollToTop = () => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const isSubpage = Boolean(pageTitle);
  const isAdminMobileSubpage = isAdminPortalSubpage(
    pathname.replace(/^\/[a-z]{2}\//, '/'),
    user?.role,
  );
  const shouldShowSecondaryRowOnMobile = !isAdminMobileSubpage || Boolean(headerContent);
  const resolvedBackLabel = backLabel ?? tCommon('back');
  return (
    <header
      id={PORTAL_MOBILE_HEADER_ID}
      className="shrink-0 bg-transparent px-[clamp(0.75rem,2vw,2rem)] py-[clamp(0.35rem,0.8vw,0.6rem)]"
    >
      <div className="w-full min-w-0 rounded-full border border-[rgba(14,14,16,0.07)] bg-white px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(0.55rem,1vw,0.9rem)] lg:rounded-[4rem]">
        <div className="flex flex-col gap-3 md:flex-row md:min-h-14 md:items-center md:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:self-stretch lg:items-stretch">
            {onMenuClick ? (
              <button
                type="button"
                onClick={onMenuClick}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#1010a3] hover:bg-[#f6f6f7] lg:hidden"
                aria-label={tCommon('openNavigationMenu')}
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

            <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-center lg:min-h-full lg:text-left">
              {isSubpage ? (
                <>
                  <div className="relative flex min-h-11 w-full items-center gap-2 lg:justify-start">
                    {onBack ? (
                      <ChatBackButton
                        onClick={onBack}
                        aria-label={resolvedBackLabel}
                        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 lg:static lg:shrink-0 lg:translate-y-0"
                      />
                    ) : null}
                    <h1 className="flex min-h-11 w-full items-center justify-center px-0 text-[1.125rem] font-bold leading-tight tracking-tight text-[#1010a3] sm:px-5 sm:text-[1.375rem] lg:min-h-0 lg:w-auto lg:flex-1 lg:justify-start lg:px-0">
                      <button
                        type="button"
                        onClick={scrollToTop}
                        className={cn(
                          'max-w-full truncate border-0 bg-transparent p-0 text-inherit cursor-pointer sm:cursor-default',
                          onBack && 'px-10 lg:px-0',
                        )}
                      >
                        {pageTitle}
                      </button>
                    </h1>
                  </div>
                  {pageSubtitle ? (
                    <p className="mt-1.5 line-clamp-2 text-xs text-[#8b8b90] sm:text-sm lg:text-left">
                      {pageSubtitle}
                    </p>
                  ) : null}
                </>
              ) : (
                <h1 className="flex min-h-11 items-center justify-center px-0 text-[1.125rem] font-bold leading-tight tracking-tight text-[#1010a3] sm:px-5 sm:text-[1.5rem] lg:min-h-0 lg:justify-start">
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="max-w-full truncate border-0 bg-transparent p-0 text-inherit cursor-pointer sm:cursor-default"
                  >
                    {t('title')}
                  </button>
                </h1>
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

              <LandingNavbarLanguageToggle className="hidden lg:inline-flex" />
              <StudentLogoutControl variant="header" className="hidden lg:inline-flex" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
