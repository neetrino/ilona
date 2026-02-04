'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Button } from '@/shared/components/ui';
import { useAdminDashboardStats } from '@/features/dashboard';

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  
  // Fetch dashboard stats
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError 
  } = useAdminDashboardStats();

  // Show error state
  if (statsError) {
    console.error('Dashboard error:', statsError);
  }

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('overview')}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title={t('totalTeachers')}
            value={stats?.teachers.total || 0}
            change={{ value: '+4.5%', type: 'positive' }}
          />
          <StatCard
            title={t('activeTeachers')}
            value={stats?.teachers.active || 0}
            change={{ value: '+2.1%', type: 'positive' }}
          />
          <StatCard
            title={t('pendingPayments')}
            value={stats?.finance.pendingPayments || 0}
            change={{ 
              value: stats?.finance.overduePayments 
                ? t('overdueCount', { count: stats.finance.overduePayments })
                : t('allOnTime'), 
              type: stats?.finance.overduePayments ? 'negative' : 'positive' 
            }}
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">{t('financeOverview')}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {t('financeDescription', { 
                    count: stats?.finance.pendingPayments || 0
                  })}
                  {stats?.finance.overduePayments 
                    ? ` ${t('overdueCount', { count: stats.finance.overduePayments })} ${t('needAttention')}.`
                    : ` ${t('allOnTime')}.`
                  }
                </p>
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  onClick={() => router.push(`/${locale}/admin/finance`)}
                >
                  {t('viewFinance')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">{t('staffOverview')}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {t('staffDescription', { count: stats?.teachers.total || 0 })}
                </p>
                <Button 
                  variant="ghost"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 p-0 h-auto"
                  onClick={() => router.push(`/${locale}/admin/teachers`)}
                >
                  {t('manageTeachers')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
