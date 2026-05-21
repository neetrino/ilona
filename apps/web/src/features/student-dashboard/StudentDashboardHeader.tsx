'use client';

import { Avatar, PublicAssetImage } from '@/shared/components/ui';
import { formatDisplayName } from '@/shared/components/ui/avatar';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { GlobalSearchBar } from '@/features/search/components/GlobalSearchBar';
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
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: dashboard } = useMyDashboard();
  const streak = dashboard?.statistics?.attendance?.currentStreak ?? 0;
  const level = dashboard?.student?.group?.level;

  const handleProfileClick = () => {
    router.push(`/${locale}/student/profile`);
  };

  const displayName = `${user?.firstName ?? ''} ${user?.lastName?.charAt(0) ?? ''}.`.trim();
  const profileName = formatDisplayName(user?.firstName, user?.lastName, displayName || tNav('user'));
  const firstName = user?.firstName ?? tNav('user');
  const isSubpage = Boolean(pageTitle);

  return (
    <header className="shrink-0 bg-[#ececec] px-3 py-3 sm:px-6 lg:px-8">
      <div className="w-full min-w-0 rounded-[2rem] border border-[rgba(14,14,16,0.07)] bg-white px-3 py-2.5 sm:rounded-[4rem] sm:px-4 sm:py-2.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {onMenuClick ? (
              <button
                type="button"
                onClick={onMenuClick}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1010a3] hover:bg-[#f6f6f7] lg:hidden"
                aria-label="Open navigation menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            ) : null}

            <div className="min-w-0 flex-1">
              {isSubpage ? (
                <>
                  <h1 className="truncate text-base font-semibold leading-tight tracking-tight text-[#1010a3] sm:text-[1.25rem]">
                    {pageTitle}
                  </h1>
                  {pageSubtitle ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[#8b8b90] sm:text-sm">
                      {pageSubtitle}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="truncate text-[0.625rem] tracking-wide text-[#8b8b90] sm:text-[0.6875rem]">
                    {t('greeting', { name: firstName })}
                  </p>
                  <h1 className="truncate text-base font-semibold leading-tight tracking-tight sm:text-[1.375rem]">
                    <span className="text-[#1010a3]">{t('titleMy')} </span>
                    <span className="font-normal text-[#5b5b62]">{t('titleLearning')}</span>
                  </h1>
                </>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="min-w-0 flex-1">
              <GlobalSearchBar
                className="w-full max-w-none"
                inputClassName="h-9 rounded-[2.125rem] border-transparent bg-[#f3f3f4] text-sm"
              />
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <div className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#ffeb8c] px-2.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm">
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

              <LanguageSwitcher variant="compact" />

              <button
                type="button"
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1010a3] text-white sm:h-9 sm:w-9"
                aria-label={tNav('settings')}
              >
                <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[#ff2e23] sm:right-1 sm:top-1 sm:h-2.5 sm:w-2.5" />
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleProfileClick}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#1010a3] py-0.5 pl-0.5 pr-2 text-left text-white sm:h-9 sm:gap-2 sm:pr-3"
              >
                <Avatar
                  src={user?.avatarUrl}
                  name={profileName}
                  size="sm"
                  alt={profileName}
                  className="h-7 w-7 shrink-0 bg-gradient-to-br from-[#fbd7c2] to-[#f3a679] text-[0.625rem] font-semibold text-white ring-2 ring-white/25 sm:h-8 sm:w-8 sm:text-xs"
                />
                <span className="hidden min-w-0 max-w-[5.5rem] whitespace-nowrap min-[480px]:block sm:max-w-[7rem]">
                  <span className="block truncate text-[0.6875rem] font-medium leading-tight sm:text-xs">
                    {displayName}
                  </span>
                  <span className="block truncate text-[0.5625rem] leading-tight text-white/70 sm:text-[0.65625rem]">
                    {t('studentRole')}
                    {level ? ` · ${level}` : ''}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
