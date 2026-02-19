'use client';

import { Badge } from '@/shared/components/ui';
import { ActionButtons } from '@/shared/components/ui';
import type { Group } from '@/features/groups';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function GroupCard({ group, onEdit, onDelete, onToggleActive }: GroupCardProps) {
  const teacherName = group.teacher
    ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
    : null;
  const studentCount = group._count?.students || 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Group Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight flex-1">
            {group.name}
          </h4>
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

        {teacherName && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate" title={teacherName}>{teacherName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>
            {studentCount}/{group.maxStudents} students
          </span>
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




