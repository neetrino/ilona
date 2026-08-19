'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

export default function TeacherStudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { readParam } = useAppSearchUrl();
  const t = useTranslations('students.teacherView');
  const locale = params.locale as string;
  const studentId = params.id as string;
  const groupId = readParam('groupId');
  const search = readParam('search');

  useEffect(() => {
    const qs = new URLSearchParams();
    if (groupId) qs.set('groupId', groupId);
    if (search) qs.set('search', search);
    qs.set('studentId', studentId);
    router.replace(`/${locale}/teacher/students?${qs.toString()}`);
  }, [groupId, locale, router, search, studentId]);

  return (
    <DashboardLayout title={t('profileTitle')} subtitle={t('loadingSubtitle')}>
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    </DashboardLayout>
  );
}
