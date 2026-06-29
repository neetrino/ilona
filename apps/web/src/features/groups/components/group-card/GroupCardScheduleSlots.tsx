import { cn } from '@/shared/lib/utils';
import type { GroupCardScheduleSlotsProps } from './group-card.types';

export function GroupCardScheduleSlots({ slots, layout = 'inline' }: GroupCardScheduleSlotsProps) {
  const pillClass =
    layout === 'paired'
      ? 'flex w-full min-w-0 items-start justify-start rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs leading-snug text-slate-700 whitespace-normal'
      : 'inline-flex max-w-full shrink-0 items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs leading-snug text-slate-700';

  return (
    <div
      className={cn(
        'min-w-0 flex-1',
        layout === 'paired'
          ? 'grid grid-cols-2 items-start gap-x-2 gap-y-1.5'
          : 'flex flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
      )}
    >
      {slots.map((slot) => (
        <span key={slot} className={pillClass} title={slot}>
          {slot}
        </span>
      ))}
    </div>
  );
}
