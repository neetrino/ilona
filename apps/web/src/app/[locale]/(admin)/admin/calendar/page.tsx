'use client';

import { useEffect } from 'react';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { ADMIN_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export default function AdminCalendarRedirectPage() {
  const router = useRouter();
  const { searchParams } = useAppSearchUrl();

  useEffect(() => {
    const query = searchParams.toString();
    const target = ADMIN_DAILY_DUTIES_BASE_PATH;
    router.replace(query ? `${target}?${query}` : target);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
