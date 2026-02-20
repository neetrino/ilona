import { cn } from '@/shared/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, icon, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 lg:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between overflow-hidden',
      className
    )}>
      <div className="space-y-2 flex-1 min-w-0 w-full sm:pr-2">
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 min-w-0">
          <p className={cn(
            'text-lg sm:text-xl lg:text-2xl font-bold leading-tight break-words',
            change?.type === 'negative' ? 'text-red-500' : 'text-slate-800'
          )}>
            {value}
          </p>
          {change && (
            <span className={cn(
              'text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 self-start sm:self-auto',
              change.type === 'positive' && 'bg-emerald-50 text-emerald-600',
              change.type === 'negative' && 'bg-red-50 text-red-500',
              change.type === 'neutral' && 'bg-slate-100 text-slate-600',
              change.type === 'warning' && 'bg-amber-50 text-amber-600'
            )}
            title={change.value}>
              {change.value}
            </span>
          )}
        </div>
      </div>
      {icon && (
        <div className="p-2 sm:p-3 bg-slate-50 rounded-xl flex-shrink-0 sm:ml-2 mt-2 sm:mt-0 self-start sm:self-auto">
          {icon}
        </div>
      )}
    </div>
  );
}

