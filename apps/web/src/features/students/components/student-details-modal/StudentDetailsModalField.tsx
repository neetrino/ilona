import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type StudentDetailsModalFieldProps = {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  className?: string;
};

export function StudentDetailsModalField({
  icon,
  label,
  value,
  className,
}: StudentDetailsModalFieldProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-slate-50/60 p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#1010a3]">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <label className="block text-sm font-medium text-slate-600">{label}</label>
          <div className="break-words text-sm font-semibold text-[#1e293b] sm:text-base">{value}</div>
        </div>
      </div>
    </div>
  );
}
