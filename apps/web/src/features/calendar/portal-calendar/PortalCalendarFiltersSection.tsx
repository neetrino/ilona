import { CalendarFilters } from '@/app/[locale]/(admin)/admin/calendar/components/CalendarFilters';

interface PortalCalendarFiltersSectionProps {
  searchQuery: string;
  selectedTeacherId: string;
  teacherOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers: boolean;
  hideTeacherFilter: boolean;
  onSearchChange: (value: string) => void;
  onTeacherChange: (teacherId: string) => void;
}

export function PortalCalendarFiltersSection({
  searchQuery,
  selectedTeacherId,
  teacherOptions,
  isLoadingTeachers,
  hideTeacherFilter,
  onSearchChange,
  onTeacherChange,
}: PortalCalendarFiltersSectionProps) {
  return (
    <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4">
      <CalendarFilters
        searchQuery={searchQuery}
        selectedTeacherId={selectedTeacherId}
        teacherOptions={teacherOptions}
        isLoadingTeachers={isLoadingTeachers}
        onSearchChange={onSearchChange}
        onTeacherChange={onTeacherChange}
        hideTeacherFilter={hideTeacherFilter}
      />
    </div>
  );
}
