import { StatusDot } from './CalendarComponents';

interface CalendarLegendProps {
  t?: (key: string) => string;
}

export function CalendarLegend({ t }: CalendarLegendProps) {
  return (
    <div className="flex items-center gap-4 mb-4 text-sm">
      <div className="flex items-center gap-1">
        <StatusDot status="SCHEDULED" />
        <span className="text-[#8b8b90]">{t?.('scheduled') || 'Scheduled'}</span>
      </div>
      <div className="flex items-center gap-1">
        <StatusDot status="IN_PROGRESS" />
        <span className="text-[#8b8b90]">{t?.('inProgress') || 'In Progress'}</span>
      </div>
      <div className="flex items-center gap-1">
        <StatusDot status="COMPLETED" />
        <span className="text-[#8b8b90]">{t?.('completed') || 'Completed'}</span>
      </div>
      <div className="flex items-center gap-1">
        <StatusDot status="CANCELLED" />
        <span className="text-[#8b8b90]">{t?.('cancelled') || 'Cancelled'}</span>
      </div>
    </div>
  );
}





