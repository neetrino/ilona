import { DailyDutiesFilters } from '@/app/[locale]/(admin)/admin/daily-duties/components/DailyDutiesFilters';
import type { DailyDutiesStatusFilter } from '@/shared/lib/daily-duties/filter-by-daily-duties-status';

interface DailyDutiesFiltersSectionProps {
  searchQuery: string;
  selectedTeacherId: string;
  selectedStatus: DailyDutiesStatusFilter;
  teacherOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers: boolean;
  hideTeacherFilter: boolean;
  onSearchChange: (value: string) => void;
  onTeacherChange: (teacherId: string) => void;
  onStatusChange: (status: DailyDutiesStatusFilter) => void;
}

export function DailyDutiesFiltersSection({
  searchQuery,
  selectedTeacherId,
  selectedStatus,
  teacherOptions,
  isLoadingTeachers,
  hideTeacherFilter,
  onSearchChange,
  onTeacherChange,
  onStatusChange,
}: DailyDutiesFiltersSectionProps) {
  return (
    <div className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4">
      <DailyDutiesFilters
        searchQuery={searchQuery}
        selectedTeacherId={selectedTeacherId}
        selectedStatus={selectedStatus}
        teacherOptions={teacherOptions}
        isLoadingTeachers={isLoadingTeachers}
        onSearchChange={onSearchChange}
        onTeacherChange={onTeacherChange}
        onStatusChange={onStatusChange}
        hideTeacherFilter={hideTeacherFilter}
      />
    </div>
  );
}
