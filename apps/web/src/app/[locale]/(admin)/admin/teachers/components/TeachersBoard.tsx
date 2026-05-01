'use client';

import { TeacherCard } from './TeacherCard';
import { TeachersCentersStrip } from './TeachersCentersStrip';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';

interface TeachersBoardProps {
  teachersByCenter: Record<string, Teacher[]>;
  centersData?: Array<Center>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
  /** Opens teacher details in CRM-style modal */
  onCardClick?: (teacher: Teacher) => void;
}

export function TeachersBoard({
  teachersByCenter,
  centersData,
  activeCenterTabId,
  onSelectCenter,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onDeactivate,
  onCardClick,
}: TeachersBoardProps) {
  const sortedCenters = centersData ?? [];
  const hasUnassigned = (teachersByCenter.unassigned?.length || 0) > 0;

  const selectedTeachers =
    activeCenterTabId === 'unassigned'
      ? teachersByCenter.unassigned || []
      : teachersByCenter[activeCenterTabId || ''] || [];

  const selectedCenter = sortedCenters.find((center) => center.id === activeCenterTabId);
  const panelTitle = activeCenterTabId === 'unassigned' ? 'Unassigned' : selectedCenter?.name || 'Center';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading teachers...</div>
      </div>
    );
  }

  if (sortedCenters.length === 0 && !hasUnassigned) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">No teachers found.</div>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <TeachersCentersStrip
        centers={sortedCenters}
        teachersByCenter={teachersByCenter}
        activeCenterTabId={activeCenterTabId}
        onSelectCenter={onSelectCenter}
      />

      <div
        className="p-4 sm:p-5"
        role="tabpanel"
        aria-label={panelTitle}
      >
        {searchQuery &&
        sortedCenters.every((center) => (teachersByCenter[center.id] || []).length === 0) &&
        !hasUnassigned ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">No teachers match your search</div>
          </div>
        ) : !activeCenterTabId ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
            <p className="text-sm text-slate-500">No centers found.</p>
          </div>
        ) : selectedTeachers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            {activeCenterTabId === 'unassigned' ? 'No unassigned teachers' : 'No teachers in this center'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onEdit={() => onEdit(teacher)}
                onDelete={() => onDelete(teacher)}
                onDeactivate={() => onDeactivate(teacher)}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

