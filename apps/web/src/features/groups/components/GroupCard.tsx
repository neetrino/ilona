import { Badge, ActionButtons } from '@/shared/components/ui';
import type { Group } from '../types';
import { getGroupOccupancyMeta } from '../occupancy';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  /** When provided, the student count becomes clickable (e.g. Admin Groups section) */
  onStudentsClick?: (groupId: string, groupName: string) => void;
}

export function GroupCard({ group, onEdit, onDelete, onToggleActive, onStudentsClick }: GroupCardProps) {
  const teacherName = group.teacher
    ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
    : null;
  const studentCount = group._count?.students || 0;
  const occupancy = getGroupOccupancyMeta(studentCount);
  const dotColorClass =
    occupancy.status === 'full'
      ? 'bg-green-500'
      : occupancy.status === 'filling'
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Group Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1 min-w-0">
          <h4
            className="font-semibold text-slate-800 text-sm leading-tight flex-1 min-w-0 truncate"
            title={group.name}
          >
            {group.name}
          </h4>
          {teacherName && (
            <div
              className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-slate-200"
              title={teacherName}
            >
              <svg
                className="w-3.5 h-3.5 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="max-w-[11rem] truncate text-sm font-medium text-slate-600">{teacherName}</span>
            </div>
          )}
          <ActionButtons
            onEdit={onEdit}
            onDisable={onToggleActive}
            onDelete={onDelete}
            isActive={group.isActive}
            size="sm"
            ariaLabels={{
              edit: 'Edit group',
              disable: group.isActive ? 'Deactivate group' : 'Activate group',
              delete: 'Delete group',
            }}
            titles={{
              edit: 'Edit group',
              disable: group.isActive ? 'Deactivate group' : 'Activate group',
              delete: 'Delete group',
            }}
          />
        </div>
        {group.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1" title={group.description}>
            {group.description}
          </p>
        )}
      </div>

      {/* Group Details */}
      <div className="space-y-2 text-xs">
        {group.level && (
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-xs py-0.5 px-2">
              {group.level}
            </Badge>
          </div>
        )}

        <div
          className={
            group.students && group.students.length > 0
              ? 'space-y-1.5 text-slate-600'
              : 'text-slate-600'
          }
        >
          <div className="flex items-start gap-1.5 text-xs">
            <svg
              className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div className="min-w-0 flex-1">
              {onStudentsClick ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStudentsClick(group.id, group.name);
                  }}
                  className="block w-full px-0 py-0 text-left underline decoration-slate-400 underline-offset-2 hover:decoration-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded [text-decoration-skip-ink:none]"
                  title="View students in this group"
                >
                  <span className="inline-block font-medium text-slate-700">
                    {studentCount}/{group.maxStudents} students
                  </span>
                </button>
              ) : (
                <span className="block font-medium text-slate-700">
                  {studentCount}/{group.maxStudents} students
                </span>
              )}
            </div>
          </div>
          {group.students && group.students.length > 0 && (
            <ul className="space-y-1.5 pl-0 text-sm text-slate-700">
              {group.students.map((s, index) => (
                <li
                  key={s.id}
                  className="flex items-baseline gap-2 leading-snug"
                  title={`${s.user.firstName} ${s.user.lastName}`}
                >
                  <span className="shrink-0 tabular-nums font-semibold text-slate-500">
                    {index + 1}.
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {s.user.firstName} {s.user.lastName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotColorClass}`} aria-hidden="true" />
          <span className="font-medium text-slate-700">{occupancy.label}</span>
        </div>

        {!group.isActive && (
          <div className="pt-1">
            <Badge variant="warning" className="text-xs py-0.5 px-2">
              Inactive
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

