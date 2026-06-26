'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore, getPortalEntryPath } from '../store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

type LoginFormProps = {
  variant?: 'default' | 'compact';
  onSuccess?: () => void;
  className?: string;
};

export function LoginForm({ variant = 'default', onSuccess, className }: LoginFormProps) {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const t = useTranslations('auth');
  const tHome = useTranslations('home');
  const tRoles = useTranslations('roles');
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.webp';
  const shouldReduceMotion = useReducedMotion();
  const isCompact = variant === 'compact';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) {
        onSuccess?.();
        router.push(getPortalEntryPath(user.role));
      }
    } catch {
      // Error is handled in store
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    clearError();
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const formFields = (
    <form onSubmit={handleSubmit} className={cn('space-y-4', isCompact && 'space-y-3')} noValidate>
      <div className={cn('space-y-2.5', isCompact && 'space-y-1.5')}>
        <Label htmlFor={isCompact ? 'landing-login-email' : 'email'} className="text-sm font-medium text-foreground">
          {t('email')}
        </Label>
        <Input
          id={isCompact ? 'landing-login-email' : 'email'}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={cn(
            'text-base transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20',
            isCompact ? 'h-10 text-sm' : 'h-12',
          )}
          aria-describedby={error ? 'error-message' : undefined}
        />
      </div>
      <div className={cn('space-y-2.5', isCompact && 'space-y-1.5')}>
        <Label htmlFor={isCompact ? 'landing-login-password' : 'password'} className="text-sm font-medium text-foreground">
          {t('password')}
        </Label>
        <Input
          id={isCompact ? 'landing-login-password' : 'password'}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={cn(
            'text-base transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20',
            isCompact ? 'h-10 text-sm' : 'h-12',
          )}
          aria-describedby={error ? 'error-message' : undefined}
        />
      </div>

      {error ? (
        <div
          id="error-message"
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 animate-in fade-in slide-in-from-top-2 duration-200"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      ) : null}

      <Button
        type="submit"
        className={cn(
          'w-full font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50',
          isCompact ? 'h-10 text-sm' : 'h-12 text-base',
        )}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
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
  );

  const demoAccounts = (
    <div className={cn('border-t border-border', isCompact ? 'mt-4 pt-4' : 'mt-8 pt-6')}>
      <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
        {t('demoAccounts')}
      </p>
      <div className={cn('grid gap-2', isCompact ? 'grid-cols-2' : 'grid-cols-2 gap-2.5 sm:grid-cols-4')}>
        <button
          type="button"
          onClick={() => fillDemoCredentials('admin@ilona.edu', 'admin123')}
          className="rounded-lg bg-muted p-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
          aria-label={`${tRoles('admin')} demo account`}
        >
          👤 {tRoles('admin')}
        </button>
        <button
          type="button"
          onClick={() => fillDemoCredentials('teacher@ilona.edu', 'teacher123')}
          className="rounded-lg bg-muted p-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
          aria-label={`${tRoles('teacher')} demo account`}
        >
          👩‍🏫 {tRoles('teacher')}
        </button>
        <button
          type="button"
          onClick={() => fillDemoCredentials('manager@ilona.edu', 'manager123')}
          className="rounded-lg bg-muted p-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
          aria-label={`${tRoles('manager')} demo account`}
        >
          🧑‍💼 {tRoles('manager')}
        </button>
        <button
          type="button"
          onClick={() => fillDemoCredentials('student@ilona.edu', 'student123')}
          className="rounded-lg bg-muted p-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
          aria-label={`${tRoles('student')} demo account`}
        >
          🎒 {tRoles('student')}
        </button>
      </div>
    </div>
  );

  if (isCompact) {
    return (
      <div className={cn('w-[min(360px,calc(100vw-2rem))] rounded-[24px] bg-white p-4 shadow-2xl', className)}>
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold text-[#093394]">{t('login')}</h2>
          <p className="text-sm text-[#4a5565]">{t('enterCredentials')}</p>
        </div>
        {formFields}
        {demoAccounts}
      </div>
    );
  }

  return (
    <Card className={cn('w-full border-border/50 bg-card shadow-2xl backdrop-blur-sm', className)}>
      <CardHeader className="space-y-3 px-6 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
        <motion.div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.2 }
              : {
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -2 }}
        >
          <Image
            src={logoUrl}
            alt="ILONA English Center"
            width={80}
            height={80}
            className="h-full w-full object-contain"
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/logo.webp';
              target.onerror = null;
            }}
          />
        </motion.div>
        <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
          {tHome('title')}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {t('enterCredentials')}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-8 sm:px-8 sm:pb-10">
        {formFields}
        {demoAccounts}
      </CardContent>
    </Card>
  );
}
