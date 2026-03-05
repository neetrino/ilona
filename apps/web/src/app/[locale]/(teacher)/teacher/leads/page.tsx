'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Teacher Leads has been moved into My Students.
 * Redirect any direct access to /teacher/leads to /teacher/students.
 */
export default function TeacherLeadsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    router.replace(`/${locale}/teacher/students`);
  }, [locale, router]);

  return null;
}
