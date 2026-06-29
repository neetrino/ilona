import { cn } from '@/shared/lib/utils';

export function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: 'green' | 'yellow' | 'red';
}) {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return (
    <div className="w-full bg-[#f1f1f2] rounded-full h-2">
      <div
        className={cn('h-2 rounded-full transition-all', colors[color])}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
