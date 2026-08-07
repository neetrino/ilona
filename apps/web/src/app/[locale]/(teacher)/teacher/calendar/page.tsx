'use client';

import { useEffect } from 'react';
import { useRouter } from '@/config/navigation';
import { TEACHER_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export default function TeacherCalendarRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(TEACHER_DAILY_DUTIES_BASE_PATH);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
      <LoadingSpinner size="lg" />
    </div>
  );
}
