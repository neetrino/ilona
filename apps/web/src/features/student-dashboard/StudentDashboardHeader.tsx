'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { useTranslations } from 'next-intl';
import { StudentLogoutControl } from '@/shared/components/layout/StudentLogoutControl';
import { PortalHeaderSearch } from '@/features/search/components/PortalHeaderSearch';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMyDashboard } from '@/features/students';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

type StudentDashboardHeaderProps = {
  pageTitle?: string;
  pageSubtitle?: string;
  onMenuClick?: () => void;
};

export function StudentDashboardHeader({
  pageTitle,
  pageSubtitle,
  onMenuClick,
}: StudentDashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const { user } = useAuthStore();
  const { data: dashboard } = useMyDashboard();
  const streak = dashboard?.statistics?.attendance?.currentStreak ?? 0;
  const level = dashboard?.student?.group?.level;
  const firstName = user?.firstName ?? tNav('user');
  const isSubpage = Boolean(pageTitle);

  return (
    <header className="shrink-0 bg-transparent px-3 py-3 sm:px-6 lg:px-8">
      <div className="w-full min-w-0 rounded-[2rem] border border-[rgba(14,14,16,0.07)] bg-white px-3 py-4 sm:rounded-[4rem] sm:px-5 sm:py-5">
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
                  <h1 className="flex h-11 items-center justify-center truncate text-[1.125rem] font-semibold leading-none tracking-tight text-[#1010a3] sm:block sm:h-auto sm:text-[1.375rem] sm:leading-tight">
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
                  <h1 className="flex h-11 items-center justify-center truncate text-[1.125rem] font-semibold leading-none tracking-tight sm:block sm:h-auto sm:text-[1.5rem] sm:leading-tight">
                    <span className="text-[#1010a3]">{t('titleMy')} </span>
                    <span className="font-normal text-[#5b5b62]">{t('titleLearning')}</span>
                  </h1>
                </>
              )}
            </div>
            {onMenuClick ? <div className="h-11 w-11 shrink-0 lg:hidden" aria-hidden /> : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1">
              <PortalHeaderSearch />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
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
