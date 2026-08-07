'use client';

import { use, useEffect } from 'react';
import { useRouter } from '@/config/navigation';
import { getTeacherDailyDutiesLessonPath } from '@/shared/lib/role-routes';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export default function TeacherCalendarLessonRedirectPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { searchParams } = useAppSearchUrl();

  useEffect(() => {
    const query = searchParams.toString();
    const target = getTeacherDailyDutiesLessonPath(resolvedParams.lessonId);
    router.replace(query ? `${target}?${query}` : target);
  }, [resolvedParams.lessonId, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
