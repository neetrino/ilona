import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type StudentDetailsModalFieldProps = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
};

export function StudentDetailsModalField({
  label,
  value,
  className,
}: StudentDetailsModalFieldProps) {
  return (
    <div
      className={cn(
        'min-[1367px]:min-w-0 min-[1367px]:flex-1 space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 p-4',
        className,
      )}
    >
      <label className="flex items-center gap-2 text-sm font-medium text-slate-600">{label}</label>
      <div className="break-words text-sm text-slate-800 sm:text-base">{value}</div>
    </div>
  );
}
