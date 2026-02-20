'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '@/shared/components/ui/input';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');
  const { user, logout } = useAuthStore();
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
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            placeholder={t('globalSearch')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 w-64 bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Component */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
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
