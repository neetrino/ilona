'use client';

import { use, useEffect } from 'react';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminDailyDutiesLessonPath } from '@/shared/lib/role-routes';

export default function AdminCalendarLessonRedirectPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { searchParams } = useAppSearchUrl();
  const { user } = useAuthStore();

  useEffect(() => {
    const query = searchParams.toString();
    const target = getAdminDailyDutiesLessonPath(resolvedParams.lessonId, user?.role);
    router.replace(query ? `${target}?${query}` : target);
  }, [resolvedParams.lessonId, router, searchParams, user?.role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
    </div>
  );
}
