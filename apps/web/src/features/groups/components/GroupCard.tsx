import Image from 'next/image';
import { Badge, ActionButtons } from '@/shared/components/ui';
import type { Group } from '../types';
import { getGroupOccupancyMeta } from '../occupancy';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  /** When provided, each student name opens that student's profile (e.g. board view) */
  onStudentClick?: (studentId: string) => void;
}

export function GroupCard({
  group,
  onEdit,
  onDelete,
  onToggleActive,
  onStudentClick,
}: GroupCardProps) {
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

  /** Fixed height for student list ≈ 8 rows (board alignment); scroll if more */
  const studentListBlockClass =
    'h-[12rem] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]';

  return (
    <div className="flex h-full min-w-0 flex-col bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Group Header */}
      <div className="mb-3 shrink-0">
        <div className="flex items-start justify-between gap-2 mb-1 min-w-0">
          <h4 className="min-w-0 flex-1 break-words font-semibold text-slate-800 text-sm leading-snug">
            {group.name}
          </h4>
          {teacherName && (
            <div
              className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-slate-200"
              title={teacherName}
            >
              <Image
                src="/teachers-logo.png"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 object-contain"
              />
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

      {/* Group Details: fixed student list height ≈ 8 rows; footer pinned to card bottom in grid */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 text-xs">
        {group.level && (
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="info" className="text-xs py-0.5 px-2">
              {group.level}
            </Badge>
          </div>
        )}

        {group.students !== undefined && (
          <div className={`shrink-0 text-slate-600 ${studentListBlockClass}`}>
            {group.students.length > 0 ? (
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
                    {onStudentClick ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStudentClick(s.id);
                        }}
                        className="min-w-0 flex-1 truncate text-left font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded"
                      >
                        {s.user.firstName} {s.user.lastName}
                      </button>
                    ) : (
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {s.user.firstName} {s.user.lastName}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {group.students !== undefined && <div className="min-h-0 flex-1" aria-hidden />}

        <div className="flex shrink-0 items-center gap-2 text-slate-600">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dotColorClass}`} aria-hidden="true" />
          <span className="font-medium text-slate-700">{occupancy.label}</span>
        </div>

        {!group.isActive && (
          <div className="shrink-0 pt-0.5">
            <Badge variant="warning" className="text-xs py-0.5 px-2">
              Inactive
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

