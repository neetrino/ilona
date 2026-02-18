'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore, getDashboardPath } from '../store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const t = useTranslations('auth');
  const tHome = useTranslations('home');
  const tRoles = useTranslations('roles');
  const { data: logoData, isLoading: isLoadingLogo } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl);
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(getDashboardPath(user.role));
      }
    } catch {
      // Error is handled in store
    }
  };

  return (
    <Card className="w-full shadow-2xl border-border/50 bg-card backdrop-blur-sm">
      <CardHeader className="space-y-3 text-center pb-6 px-6 pt-8 sm:px-8 sm:pt-10">
        <motion.div
          className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg overflow-hidden bg-primary"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.2 }
              : {
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1], // cubic-bezier ease-out
                }
          }
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -2 }}
        >
          {logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt="Company Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to default icon if logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center hidden">
                <span className="text-3xl text-primary-foreground font-bold">I</span>
              </div>
            </>
          ) : (
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
              {isLoadingLogo ? (
                <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-3xl text-primary-foreground font-bold">I</span>
              )}
            </div>
          )}
        </motion.div>
        <CardTitle className="text-3xl font-semibold text-foreground tracking-tight">
          {tHome('title')}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {t('enterCredentials')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8 sm:px-8 sm:pb-10">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-12 text-base transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              {t('password')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-12 text-base transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
              aria-describedby={error ? 'error-message' : undefined}
            />
          </div>

          {error && (
            <div 
              id="error-message"
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('signingIn')}
              </span>
            ) : (
              t('loginButton')
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-4 font-medium">
            {t('demoAccounts')}
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => { setEmail('admin@ilona.edu'); setPassword('admin123'); }}
              className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 text-xs font-medium text-foreground hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
              aria-label={`${tRoles('admin')} demo account`}
            >
              👤 {tRoles('admin')}
            </button>
            <button
              type="button"
              onClick={() => { setEmail('teacher@ilona.edu'); setPassword('teacher123'); }}
              className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 text-xs font-medium text-foreground hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
              aria-label={`${tRoles('teacher')} demo account`}
            >
              👩‍🏫 {tRoles('teacher')}
            </button>
            <button
              type="button"
              onClick={() => { setEmail('student@ilona.edu'); setPassword('student123'); }}
              className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 text-xs font-medium text-foreground hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
              aria-label={`${tRoles('student')} demo account`}
            >
              🎒 {tRoles('student')}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
