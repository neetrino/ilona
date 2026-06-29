import { type useTranslations as UseTranslations } from 'next-intl';
import type { Payment } from '@/features/finance/api/student-finance.api';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { StudentPrimaryButton } from '@/features/student-ui';
import { PaymentMobileField } from './PaymentMobileField';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export function PaymentMobileCard({
  payment,
  t,
  tCommon,
  onPay,
  isProcessing,
}: {
  payment: Payment;
  t: ReturnType<typeof UseTranslations<'finance'>>;
  tCommon: ReturnType<typeof UseTranslations<'common'>>;
  onPay: (payment: Payment) => void;
  isProcessing: boolean;
}) {
  const monthDate = payment.month ? new Date(payment.month) : new Date(payment.dueDate);
  const unpaid = payment.status === 'PENDING' || payment.status === 'OVERDUE';
  const canPay = payment.canPay === true;
  const groupName = payment.student?.group?.name;
  const description = payment.notes || payment.description;
  const windowReason = payment.paymentWindowReason;
  const monthLabel = monthDate.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const dateLabel =
    payment.status === 'PAID' && payment.paidAt
      ? `${t('paidOn')} ${new Date(payment.paidAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : new Date(payment.dueDate).toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

  return (
    <article className="rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#1010a3]">{monthLabel}</h3>
      {description ? <p className="mt-1.5 text-sm text-[#8b8b90]">{description}</p> : null}

      <div className="mt-2">
        <PaymentMobileField label={tCommon('group') ?? 'Group'}>
          <span className="text-base text-[#3b3b40]">{groupName ?? '—'}</span>
        </PaymentMobileField>
        <PaymentMobileField label={t('amount') ?? 'Amount'}>
          <span
            className={cn(
              'text-lg font-semibold tracking-tight',
              payment.status === 'PAID'
                ? 'text-[#0a7a3e]'
                : payment.status === 'OVERDUE'
                  ? 'text-[#b42318]'
                  : 'text-[#1010a3]',
            )}
          >
            {formatCurrency(Number(payment.amount))}
          </span>
        </PaymentMobileField>
        <PaymentMobileField label={t('status') ?? 'Status'}>
          <div className="flex justify-end">
            <PaymentStatusBadge
              status={payment.status}
              t={t}
              className="px-3 py-1 text-xs"
            />
          </div>
        </PaymentMobileField>
        <PaymentMobileField label={t('dueDate') ?? 'Due Date'} isLast>
          <div className="text-right">
            <span className="text-base font-medium text-[#1010a3]">{dateLabel}</span>
            {unpaid && !canPay && windowReason === 'past' && (
              <p className="mt-1.5 text-sm text-[#8b4a00]" role="status">
                {t('paymentPeriodEnded')}
              </p>
            )}
            {unpaid && !canPay && windowReason === 'future' && (
              <p className="mt-1.5 text-sm text-[#8b8b90]" role="status">
                {t('paymentNotYetAvailable', { month: monthLabel })}
              </p>
            )}
          </div>
        </PaymentMobileField>
      </div>

      {unpaid ? (
        <StudentPrimaryButton
          type="button"
          onClick={() => canPay && onPay(payment)}
          disabled={!canPay || isProcessing}
          className="mt-6 min-h-12 w-full text-base"
          title={
            !canPay && windowReason === 'past'
              ? t('paymentPeriodEnded')
              : !canPay && windowReason === 'future'
                ? t('paymentNotYetAvailable', { month: monthLabel })
                : undefined
          }
        >
          {t('pay')}
        </StudentPrimaryButton>
      ) : (
        <p className="mt-6 text-center text-base font-semibold text-[#0a7a3e]">{t('paid')}</p>
      )}
    </article>
  );
}
