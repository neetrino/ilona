'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

export default function AdminCrmPage() {
  const t = useTranslations('nav');

  return (
    <DashboardLayout title={t('crm')} subtitle="">
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        {/* Empty placeholder – content will be added later */}
      </div>
    </DashboardLayout>
  );
}
