'use client';

import { useEffect } from 'react';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { ADMIN_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';

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
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
    </div>
  );
}
