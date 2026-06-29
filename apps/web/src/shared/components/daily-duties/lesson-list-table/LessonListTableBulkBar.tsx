import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';

interface LessonListTableBulkBarProps {
  selectedCount: number;
  allSelected: boolean;
  hasSelectedLessons: boolean;
  onBulkDelete: () => void;
}

export function LessonListTableBulkBar({
  selectedCount,
  allSelected,
  hasSelectedLessons,
  onBulkDelete,
}: LessonListTableBulkBarProps) {
  const tCal = useTranslations('dailyDuties');

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-blue-50 px-6 py-3">
      <span className="text-sm font-medium text-blue-900">
        {selectedCount === 0
          ? tCal('bulkSelectHint')
          : tCal('lessonsSelected', { count: selectedCount })}
      </span>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          hasSelectedLessons
            ? 'max-w-[11rem] translate-x-0 opacity-100'
            : 'max-w-0 translate-x-2 opacity-0',
        )}
        aria-hidden={!hasSelectedLessons}
      >
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          tabIndex={hasSelectedLessons ? 0 : -1}
        >
          {allSelected
            ? tCal('deleteAll', { count: selectedCount })
            : tCal('deleteSelected', { count: selectedCount })}
        </Button>
      </div>
    </div>
  );
}
