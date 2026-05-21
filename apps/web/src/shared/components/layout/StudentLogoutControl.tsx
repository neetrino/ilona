'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Avatar, formatDisplayName } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

type StudentLogoutControlProps = {
  variant?: 'header' | 'sidebar';
  className?: string;
  roleDetail?: string;
  onAfterLogout?: () => void;
};

export function StudentLogoutControl({
  variant = 'header',
  className,
  roleDetail,
  onAfterLogout,
}: StudentLogoutControlProps) {
  const logout = useLogout();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuthStore();
  const tAuth = useTranslations('auth');
  const tNav = useTranslations('nav');
  const tDash = useTranslations('dashboard');

  const profileName = formatDisplayName(
    user?.firstName,
    user?.lastName,
    tNav('user'),
  );
  const shortName = `${user?.firstName ?? ''} ${user?.lastName?.charAt(0) ?? ''}.`.trim();
  const isTeacher = user?.role === 'TEACHER';
  const roleLabel = isTeacher ? tDash('teacherRole') : tDash('studentRole');
  const displayLabel =
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || roleLabel;
  const roleLine =
    roleDetail != null && roleDetail !== ''
      ? `${roleLabel} · ${roleDetail}`
      : roleLabel;

  const handleLogout = () => {
    onAfterLogout?.();
    logout();
    router.replace('/');
  };

  const profileHref =
    user?.role === 'TEACHER'
      ? `/${locale}/teacher/profile`
      : `/${locale}/student/profile`;

  const pillSizes =
    'inline-flex h-11 shrink-0 items-center rounded-full bg-[#1010a3] text-white sm:h-12';

  if (variant === 'sidebar') {
    const sidebarLabel = shortName || displayLabel || roleLabel;

    return (
      <div
        className={cn(
          'flex w-full min-h-[3.25rem] items-center gap-3 rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] px-4 py-2.5',
          className,
        )}
      >
        <Link
          href={profileHref}
          onClick={onAfterLogout}
          className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Avatar
            src={user?.avatarUrl}
            name={profileName}
            size="sm"
            alt={profileName}
            className="h-10 w-10 shrink-0 border-2 border-white bg-gradient-to-br from-[#fbd7c2] to-[#f3a679] text-sm font-semibold text-white shadow-sm"
          />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-[#242427]">
            {sidebarLabel}
          </p>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-lg p-3 text-[#8b8b90] transition-colors hover:bg-[#f1f1f2] hover:text-[#3b3b40] sm:p-3.5"
          title={tAuth('logout')}
          aria-label={tAuth('logout')}
        >
          <LogoutIcon className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        pillSizes,
        'items-center gap-0.5 py-0.5 pl-0.5 pr-1 sm:pr-2',
        className,
      )}
    >
      <Link
        href={profileHref}
        className="inline-flex min-w-0 items-center gap-1.5 rounded-full pr-1 transition-opacity hover:opacity-90 sm:gap-2 sm:pr-1.5"
      >
        <Avatar
          src={user?.avatarUrl}
          name={profileName}
          size="sm"
          alt={profileName}
          className="h-9 w-9 shrink-0 bg-gradient-to-br from-[#fbd7c2] to-[#f3a679] text-xs font-semibold text-white ring-2 ring-white/25 sm:h-10 sm:w-10"
        />
        <span className="hidden min-w-0 max-w-[5.5rem] whitespace-nowrap min-[480px]:block sm:max-w-[7rem]">
          <span className="block truncate text-[0.6875rem] font-medium leading-tight sm:text-xs">
            {shortName || displayLabel}
          </span>
          <span className="block truncate text-[0.5625rem] leading-tight text-white/70 sm:text-[0.65625rem]">
            {roleLine}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:p-2"
        title={tAuth('logout')}
        aria-label={tAuth('logout')}
      >
        <LogoutIcon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" />
      </button>
    </div>
  );
}
