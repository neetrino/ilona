'use client';

import { StudentCard } from './StudentCard';
import type { Student } from '@/features/students';
import type { Center } from '@ilona/types';

interface StudentsBoardProps {
  studentsByCenter: Record<string, Student[]>;
  centersData?: Array<Center>;
  isLoading: boolean;
  searchQuery: string;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onDeactivate: (student: Student) => void;
}

export function StudentsBoard({
  studentsByCenter,
  centersData,
  isLoading,
  searchQuery,
  onEdit,
  onDelete,
  onDeactivate,
}: StudentsBoardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading students...</div>
      </div>
    );
  }

  const allCenters = centersData || [];
  const hasStudents = Object.values(studentsByCenter).some(students => students.length > 0);

  if (allCenters.length === 0 && (!studentsByCenter['unassigned'] || studentsByCenter['unassigned'].length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">No students found.</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 pb-4 min-w-max">
        {/* Center Columns */}
        {allCenters
          .filter((center) => {
            // When searching/filtering, only show centers with matching students
            const centerStudents = studentsByCenter[center.id] || [];
            return centerStudents.length > 0;
          })
          .map((center) => {
            const centerStudents = studentsByCenter[center.id] || [];
            return (
              <div
                key={center.id}
                className="flex-shrink-0 w-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl">
                  <h3 className="font-semibold text-slate-800">{center.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {centerStudents.length} {centerStudents.length === 1 ? 'student' : 'students'}
                  </p>
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
                  {centerStudents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No students
                    </div>
                  ) : (
                    centerStudents.map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        onEdit={() => onEdit(student)}
                        onDelete={() => onDelete(student)}
                        onDeactivate={() => onDeactivate(student)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        
        {/* Unassigned Students Column */}
        {studentsByCenter['unassigned'] && studentsByCenter['unassigned'].length > 0 && (
          <div className="flex-shrink-0 w-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
            {/* Column Header */}
            <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl">
              <h3 className="font-semibold text-slate-800">Unassigned</h3>
              <p className="text-sm text-slate-500 mt-1">
                {studentsByCenter['unassigned'].length} {studentsByCenter['unassigned'].length === 1 ? 'student' : 'students'}
              </p>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
              {studentsByCenter['unassigned'].map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onEdit={() => onEdit(student)}
                  onDelete={() => onDelete(student)}
                  onDeactivate={() => onDeactivate(student)}
                />
              ))}
            </div>
          </div>
        )}
        
        {searchQuery && allCenters.filter((center) => {
          const centerStudents = studentsByCenter[center.id] || [];
          return centerStudents.length > 0;
        }).length === 0 && (!studentsByCenter['unassigned'] || studentsByCenter['unassigned'].length === 0) && (
          <div className="flex items-center justify-center py-12 w-full">
            <div className="text-slate-500">No students match your search</div>
          </div>
        )}
      </div>
    </div>
  );
}

