'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { GlobalSearchBar } from '@/features/search/components/GlobalSearchBar';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMyDashboard } from '@/features/students';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

export function StudentDashboardHeader() {
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
  const firstName = user?.firstName ?? tNav('user');

  return (
    <header className="shrink-0 bg-[#ececec] px-3 py-3 sm:px-6 lg:px-8">
      <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto rounded-[4rem] border border-[rgba(14,14,16,0.07)] bg-white px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 sm:px-4 sm:py-2.5 [&::-webkit-scrollbar]:hidden">
        {/* Title — fixed width, never wraps */}
        <div className="shrink-0 whitespace-nowrap pr-1">
          <p className="truncate text-[0.625rem] tracking-wide text-[#8b8b90] sm:text-[0.6875rem]">
            {t('greeting', { name: firstName })}
          </p>
          <h1 className="truncate text-base font-semibold leading-tight tracking-tight sm:text-[1.375rem]">
            <span className="text-[#1010a3]">{t('titleMy')} </span>
            <span className="font-normal text-[#5b5b62]">{t('titleLearning')}</span>
          </h1>
        </div>

        {/* Search — shrinks before actions overlap */}
        <div className="min-w-[5.5rem] flex-1 shrink">
          <GlobalSearchBar
            className="w-full max-w-none"
            inputClassName="h-9 rounded-[2.125rem] border-transparent bg-[#f3f3f4] text-sm"
          />
        </div>

        {/* Actions — single row, no wrap */}
        <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
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
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fbd7c2] to-[#f3a679] text-[0.625rem] font-semibold sm:text-xs">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
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
    </header>
  );
}
