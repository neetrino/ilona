import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const mobileFieldLabelClass = 'text-xs font-semibold uppercase tracking-wider text-[#8b8b90]';

export function PaymentMobileField({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 py-4">
        <p className={cn('shrink-0', mobileFieldLabelClass)}>{label}</p>
        <div className="min-w-0 break-words text-right [overflow-wrap:anywhere]">{children}</div>
      </div>
      {!isLast ? <div className="border-t border-[rgba(14,14,16,0.07)]" /> : null}
    </>
  );
}
