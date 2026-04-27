import Image from 'next/image';
import { Clock, UserPlus } from 'lucide-react';
import { Badge, ActionButtons } from '@/shared/components/ui';
import type { Group, GroupScheduleEntry } from '../types';
import { getGroupOccupancyMeta } from '../occupancy';
import { GroupIconDisplay } from '../group-icon-registry';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatScheduleSummary(entries: GroupScheduleEntry[] | null | undefined): string[] | null {
  if (!entries || entries.length === 0) return null;
  return entries
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .map((e) => `${DAY_LABELS[e.dayOfWeek] ?? 'Unknown day'}: ${e.startTime} - ${e.endTime}`);
}

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  /** When provided, each student name opens that student's profile (e.g. board view) */
  onStudentClick?: (studentId: string) => void;
  /** Disables the active/inactive toggle (e.g. while a status update is in progress) */
  isStatusTogglePending?: boolean;
}

export function GroupCard({
  group,
  onEdit,
  onDelete,
  onToggleActive,
  onStudentClick,
  isStatusTogglePending = false,
}: GroupCardProps) {
  const teacherName = group.teacher
    ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
    : null;
  const substituteName = group.substituteTeacher
    ? `${group.substituteTeacher.user.firstName} ${group.substituteTeacher.user.lastName}`
    : null;
  const scheduleSummary = formatScheduleSummary(group.schedule ?? null);
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
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <span className="mt-0.5 shrink-0" aria-hidden>
              <GroupIconDisplay iconKey={group.iconKey} size={20} />
            </span>
            <h4 className="min-w-0 flex-1 break-words font-semibold text-slate-800 text-sm leading-snug">
              {group.name}
            </h4>
          </div>
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
            disableDisabled={isStatusTogglePending}
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
        {(substituteName || scheduleSummary) && (
          <div className="mt-2 flex flex-col items-start gap-1.5 text-xs text-slate-600">
            {substituteName && (
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800"
                title={`Substitute teacher: ${substituteName}`}
              >
                <UserPlus className="h-3 w-3" /> Sub: <span className="font-medium">{substituteName}</span>
              </span>
            )}
            {scheduleSummary && (
              <div className="flex w-full min-w-0 items-start gap-1 text-slate-600">
                <Clock className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {scheduleSummary.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 leading-snug text-slate-700 break-words"
                      title={slot}
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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

