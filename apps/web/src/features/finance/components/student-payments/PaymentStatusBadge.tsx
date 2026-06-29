import { type useTranslations as UseTranslations } from 'next-intl';
import { StudentBadge, paymentStatusVariant } from '@/features/student-ui';

export function PaymentStatusBadge({
  status,
  t,
  className,
}: {
  status: string;
  t: ReturnType<typeof UseTranslations<'finance'>>;
  className?: string;
}) {
  const label =
    status === 'PENDING'
      ? t('pending')
      : status === 'PAID'
        ? t('paid')
        : status === 'OVERDUE'
          ? t('overdue')
          : status === 'CANCELLED'
            ? t('cancelled')
            : status;

  return (
    <StudentBadge variant={paymentStatusVariant(status)} className={className}>
      {label}
    </StudentBadge>
  );
}
