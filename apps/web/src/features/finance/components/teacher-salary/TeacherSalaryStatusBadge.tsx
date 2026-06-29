import { cn } from '@/shared/lib/utils';

type TeacherSalaryStatusBadgeProps = {
  status: string;
  labels: Record<string, string>;
};

export function TeacherSalaryStatusBadge({ status, labels }: TeacherSalaryStatusBadgeProps) {
  const styles: Record<string, { bg: string; text: string; labelKey: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', labelKey: 'pending' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', labelKey: 'processing' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', labelKey: 'paid' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', labelKey: 'cancelled' },
  };

  const style = styles[status];
  const label = style ? labels[style.labelKey] ?? status : status;
  const colors = style ?? { bg: 'bg-[#f6f6f7]', text: 'text-[#3b3b40]' };

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', colors.bg, colors.text)}>
      {label}
    </span>
  );
}
