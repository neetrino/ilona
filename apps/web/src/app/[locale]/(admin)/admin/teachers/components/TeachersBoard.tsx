'use client';

import { TeacherCard } from './TeacherCard';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';

interface TeachersBoardProps {
  teachersByCenter: Record<string, Teacher[]>;
  centersData?: Array<Center>;
  isLoading: boolean;
  searchQuery: string;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
}

export function TeachersBoard({
  teachersByCenter,
  centersData,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onDeactivate,
}: TeachersBoardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading teachers...</div>
      </div>
    );
  }

  const allCenters = centersData || [];

  if (allCenters.length === 0 && (!teachersByCenter['unassigned'] || teachersByCenter['unassigned'].length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">No teachers found.</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 pb-4 min-w-max">
        {/* Center Columns */}
        {allCenters
          .filter((center) => {
            // When searching/filtering, only show centers with matching teachers
            const centerTeachers = teachersByCenter[center.id] || [];
            return centerTeachers.length > 0;
          })
          .map((center) => {
            const centerTeachers = teachersByCenter[center.id] || [];
            return (
              <div
                key={center.id}
                className="flex-shrink-0 w-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl">
                  <h3 className="font-semibold text-slate-800">{center.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {centerTeachers.length} {centerTeachers.length === 1 ? 'teacher' : 'teachers'}
                  </p>
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
                  {centerTeachers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No teachers
                    </div>
                  ) : (
                    centerTeachers.map((teacher) => (
                      <TeacherCard
                        key={teacher.id}
                        teacher={teacher}
                        onEdit={() => onEdit(teacher)}
                        onDelete={() => onDelete(teacher)}
                        onDeactivate={() => onDeactivate(teacher)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        
        {/* Unassigned Teachers Column */}
        {teachersByCenter['unassigned'] && teachersByCenter['unassigned'].length > 0 && (
          <div className="flex-shrink-0 w-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
            {/* Column Header */}
            <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl">
              <h3 className="font-semibold text-slate-800">Unassigned</h3>
              <p className="text-sm text-slate-500 mt-1">
                {teachersByCenter['unassigned'].length} {teachersByCenter['unassigned'].length === 1 ? 'teacher' : 'teachers'}
              </p>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
              {teachersByCenter['unassigned'].map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onEdit={() => onEdit(teacher)}
                  onDelete={() => onDelete(teacher)}
                  onDeactivate={() => onDeactivate(teacher)}
                />
              ))}
            </div>
          </div>
        )}
        
        {searchQuery && allCenters.filter((center) => {
          const centerTeachers = teachersByCenter[center.id] || [];
          return centerTeachers.length > 0;
        }).length === 0 && (!teachersByCenter['unassigned'] || teachersByCenter['unassigned'].length === 0) && (
          <div className="flex items-center justify-center py-12 w-full">
            <div className="text-slate-500">No teachers match your search</div>
          </div>
        )}
      </div>
    </div>
  );
}

