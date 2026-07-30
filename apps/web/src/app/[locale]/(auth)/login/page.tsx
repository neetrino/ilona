'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuthStore, getPortalEntryPath } from '@/features/auth/store/auth.store';
import { useLogo } from '@/features/settings/hooks/useSettings';
import { getFullApiUrl } from '@/shared/lib/api';
import { LandingNavbar } from '@/shared/components/layout/LandingNavbar';

function LoginPageShell({ children }: { children: React.ReactNode }) {
  const { data: logoData } = useLogo();
  const logoUrl = getFullApiUrl(logoData?.logoUrl) || '/logo.webp';

  return (
    <>
      <LandingNavbar logoUrl={logoUrl} profileHref="/login" logoHref="/" />
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-background to-slate-100 px-4 pb-6 pt-24 sm:px-6 sm:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px] opacity-30" />
        {children}
      </div>
    </>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user, setHydrated } = useAuthStore();

  useEffect(() => {
    const finish = () => setHydrated();
    const unsub = useAuthStore.persist.onFinishHydration(finish);
    if (useAuthStore.persist.hasHydrated()) {
      finish();
    }
    // Failsafe: never leave the login UI blocked on hydration.
    const timer = window.setTimeout(finish, 1000);
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [setHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && user) {
      router.replace(getPortalEntryPath(user.role));
    }
  }, [isAuthenticated, isHydrated, user, router]);

  if (!isHydrated) {
    return (
      <LoginPageShell>
        <div className="relative z-10 flex min-h-[calc(100vh-7rem)] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </LoginPageShell>
    );
  }

  if (isAuthenticated && user) {
    return (
      <LoginPageShell>
        <div className="relative z-10 flex min-h-[calc(100vh-7rem)] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </LoginPageShell>
    );
  }

  return (
    <LoginPageShell>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[480px] items-center animate-in fade-in duration-500">
        <LoginForm />
      </div>
    </LoginPageShell>
  );
}
