'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { LandingNavbarLanguageToggle } from '@/shared/components/layout/LandingNavbarLanguageToggle';
import { useAuthStore } from '@/features/auth/store/auth.store';
import Image from 'next/image';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { StudentStreakBadge } from './StudentStreakBadge';
import { GlobalSearchBar } from '@/features/search/components/GlobalSearchBar';
import { NotificationBellButton } from '@/features/notifications';

interface HeaderProps {
  title: string;
  subtitle?: string;
  headerContent?: React.ReactNode;
}

export function Header({ title, subtitle, headerContent }: HeaderProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();
  const tAuth = useTranslations('auth');
  const tNav = useTranslations('nav');

  const handleProfileClick = () => {
    if (!user?.role) return;
    
    // Get the current locale from pathname
    const segments = pathname.split('/');
    const currentLocale = segments[1] || locale;
    
    // Navigate to profile page based on role
    const profilePath = `/${currentLocale}/${user.role.toLowerCase()}/profile`;
    router.push(profilePath);
  };

  const handleLogout = () => {
    logout();
    // Redirect to root page after logout
    router.replace('/');
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {user ? <GlobalSearchBar /> : null}

        {user?.role === 'STUDENT' ? <StudentStreakBadge /> : null}

        {headerContent}

        {/* Language Switcher */}
        <LandingNavbarLanguageToggle className="hidden lg:inline-flex" />

        <NotificationBellButton />

        {/* Profile Component */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10">
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-sm ${user?.avatarUrl ? 'hidden' : ''}`}
              >
                {user?.firstName?.[0] || user?.lastName?.[0] || 'U'}
              </div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-slate-800 truncate">
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TEACHER' ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Teacher' : user?.role === 'STUDENT' ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student' : user?.firstName || tNav('user')}
              </p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            title={tAuth('logout')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
