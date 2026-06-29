import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, getPortalEntryPath } from '@/features/auth/store/auth.store';

export function useLandingAuthRedirect(): { isLoading: boolean } {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      router.replace(getPortalEntryPath(user.role));
    }
  }, [isAuthenticated, isHydrated, user, router]);

  return { isLoading: !isHydrated || (isAuthenticated && !!user) };
}
