import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { usePortalShell } from '@/shared/context/portal-shell-context';
import { portalCardClass } from '@/shared/lib/portal-theme';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  icon?: React.ReactNode;
  className?: string;
  wrapTitle?: boolean;
  stackChangeOnDesktop?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  className,
  wrapTitle = false,
  stackChangeOnDesktop = false,
}: StatCardProps) {
  const isPortal = usePortalShell();

  if (isPortal) {
    return (
      <div className={cn(portalCardClass, 'flex flex-col overflow-hidden sm:flex-row sm:items-start sm:justify-between', className)}>
        <div className="min-w-0 flex-1 space-y-2 sm:pr-2">
          <p
            className={cn(
              'text-xs tracking-wide text-[#8b8b90]',
              wrapTitle ? 'whitespace-normal break-words leading-snug' : 'truncate',
            )}
          >
            {title}
          </p>
          <div
            className={cn(
              'flex min-w-0 flex-col gap-2 sm:gap-3',
              stackChangeOnDesktop ? 'sm:flex-col sm:items-start' : 'sm:flex-row sm:items-baseline',
            )}
          >
            <p
              className={cn(
                'break-words text-lg font-bold leading-tight tracking-tight sm:text-xl lg:text-2xl',
                change?.type === 'negative' ? 'text-[#ff2e23]' : 'text-[#1010a3]',
              )}
            >
              {value}
            </p>
            {change ? (
              <span
                className={cn(
                  'flex-shrink-0 self-start rounded-full px-2 py-0.5 text-xs font-semibold sm:self-auto',
                  wrapTitle ? 'whitespace-normal break-words sm:whitespace-nowrap' : 'whitespace-nowrap',
                  change.type === 'positive' && 'bg-[#d9f4e8] text-[#0d6b42]',
                  change.type === 'negative' && 'bg-[#ffe5e3] text-[#ff2e23]',
                  change.type === 'neutral' && 'bg-[#f6f6f7] text-[#3b3b40]',
                  change.type === 'warning' && 'bg-[#ffeb8c] text-[#3a2f00]',
                )}
                title={change.value}
              >
                {change.value}
              </span>
            ) : null}
          </div>
        </div>
        {icon ? (
          <div className="mt-2 flex-shrink-0 self-start rounded-[0.875rem] bg-[#f6f6f7] p-2 sm:ml-2 sm:mt-0">{icon}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 lg:p-6',
        className,
      )}
    >
      <div className="min-w-0 w-full flex-1 space-y-2 sm:pr-2">
        <p
          className={cn(
            'text-sm font-medium text-slate-500',
            wrapTitle ? 'whitespace-normal break-words leading-snug' : 'truncate',
          )}
        >
          {title}
        </p>
        <div
          className={cn(
            'flex min-w-0 flex-col gap-2 sm:gap-3',
            stackChangeOnDesktop ? 'sm:flex-col sm:items-start' : 'sm:flex-row sm:items-baseline',
          )}
        >
          <p
            className={cn(
              'break-words text-lg font-bold leading-tight sm:text-xl lg:text-2xl',
              change?.type === 'negative' ? 'text-red-500' : 'text-slate-800',
            )}
          >
            {value}
          </p>
          {change && (
            <span
              className={cn(
                'flex-shrink-0 self-start rounded-full px-2 py-0.5 text-xs font-semibold sm:self-auto',
                wrapTitle ? 'whitespace-normal break-words sm:whitespace-nowrap' : 'whitespace-nowrap',
                change.type === 'positive' && 'bg-emerald-50 text-emerald-600',
                change.type === 'negative' && 'bg-red-50 text-red-500',
                change.type === 'neutral' && 'bg-slate-100 text-slate-600',
                change.type === 'warning' && 'bg-amber-50 text-amber-600',
              )}
              title={change.value}
            >
              {change.value}
            </span>
          )}
        </div>
      </div>
      {icon && (
        <div className="mt-2 flex-shrink-0 self-start rounded-xl bg-slate-50 p-2 sm:ml-2 sm:mt-0">{icon}</div>
      )}
    </div>
  );
}
