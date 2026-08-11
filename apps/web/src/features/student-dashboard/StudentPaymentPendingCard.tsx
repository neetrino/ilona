'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency } from '@/shared/lib/utils';
import type { StudentPayment } from '@/features/students';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

type StudentPaymentPendingCardProps = {
  payments: StudentPayment[];
};

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function StudentPaymentPendingCard({ payments }: StudentPaymentPendingCardProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  if (payments.length === 0) return null;

  const primary = payments[0];
  const amount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const daysLeft = daysUntil(primary.dueDate);
  const dueFormatted = new Date(primary.dueDate).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const isOverdue = primary.status === 'OVERDUE' || daysLeft === 0;

  return (
    <section className="rounded-[1.375rem] border border-[rgba(14,14,16,0.07)] bg-white p-5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)] sm:p-6">
      <p className="text-[0.6875rem] font-normal uppercase tracking-[0.16em] text-[#8b8b90]">
        {t('payment.pendingLabel')}
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p className="text-[1.75rem] font-bold italic tracking-tight text-[#1010a3]">
          {formatCurrency(amount)}
        </p>
        <p className="pb-1 text-sm font-medium italic text-[#3b3b40]">
          · {t('payment.planLabel', { month: primary.month, year: primary.year })}
        </p>
      </div>
      <p className="mt-3 text-sm italic text-[#3b3b40]">
        <span>{t('payment.due')} </span>
        <span className={isOverdue ? 'font-bold text-[#e91f00]' : 'font-bold'}>
          {dueFormatted}
        </span>
        <span>
          {' '}
          · {t('stats.daysLeft', { count: daysLeft })}
          {payments.length > 1 ? ` · ${t('payment.count', { count: payments.length })}` : ''}
        </span>
      </p>
      <div className="mt-4 flex justify-end">
        <Link
          href={`/${locale}/student/payments`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#59ad0b] pl-4 pr-1 text-[0.8125rem] font-semibold italic text-white"
        >
          {t('payment.payNow')}
          <span className="flex h-[1.8125rem] w-[1.8125rem] items-center justify-center rounded-[1.25rem] bg-white">
            <PublicAssetImage src={STUDENT_DASHBOARD_ASSETS.arrowPay} alt="" width={14} height={14} />
          </span>
        </Link>
      </div>
    </section>
  );
}
