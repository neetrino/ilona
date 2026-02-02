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
      'bg-white rounded-2xl border border-slate-200 p-6 flex items-start justify-between',
      className
    )}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="flex items-baseline gap-3">
          <p className={cn(
            'text-3xl font-bold',
            change?.type === 'negative' ? 'text-red-500' : 'text-slate-800'
          )}>
            {value}
          </p>
          {change && (
            <span className={cn(
              'text-sm font-semibold px-2 py-0.5 rounded-full',
              change.type === 'positive' && 'bg-emerald-50 text-emerald-600',
              change.type === 'negative' && 'bg-red-50 text-red-500',
              change.type === 'neutral' && 'bg-slate-100 text-slate-600',
              change.type === 'warning' && 'bg-amber-50 text-amber-600'
            )}>
              {change.value}
            </span>
          )}
        </div>
      </div>
      {icon && (
        <div className="p-3 bg-slate-50 rounded-xl">
          {icon}
        </div>
      )}
    </div>
  );
}

