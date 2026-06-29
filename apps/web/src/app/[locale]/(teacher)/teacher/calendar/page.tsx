'use client';

import { useEffect } from 'react';
import { useRouter } from '@/config/navigation';
import { TEACHER_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';

export default function TeacherCalendarRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(TEACHER_DAILY_DUTIES_BASE_PATH);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececec]">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#f1f1f2] border-t-[#1010a3]" />
    </div>
  );
}
