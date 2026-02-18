'use client';

import { Badge } from '@/shared/components/ui';
import { ActionButtons } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import type { Teacher } from '@/features/teachers';

interface TeacherCardProps {
  teacher: Teacher;
  onEdit: () => void;
  onDelete: () => void;
  onDeactivate: () => void;
}

export function TeacherCard({ teacher, onEdit, onDelete, onDeactivate }: TeacherCardProps) {
  const firstName = teacher.user?.firstName || '';
  const lastName = teacher.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const phone = teacher.user?.phone || 'No phone';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
  const isActive = teacher.user?.status === 'ACTIVE';
  const hourlyRate = typeof teacher.hourlyRate === 'string' ? parseFloat(teacher.hourlyRate) : Number(teacher.hourlyRate || 0);
  const studentCount = teacher._count?.students || 0;
  
  // Get centers
  const centers = teacher.centers || 
    Array.from(
      new Map(
        (teacher.groups || [])
          .filter((group) => group.center)
          .map((group) => [group.center!.id, group.center!])
      ).values()
    );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Teacher Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-slate-600 font-semibold flex-shrink-0 text-xs", isActive ? "bg-slate-200" : "bg-slate-100")}>
              {initials}
            </div>
            <h4 className={cn("font-semibold text-slate-800 text-sm leading-tight truncate", !isActive && "text-slate-500")}>
              {fullName}
            </h4>
          </div>
          <ActionButtons
            onEdit={onEdit}
            onDisable={onDeactivate}
            onDelete={onDelete}
            isActive={isActive}
            size="sm"
            ariaLabels={{
              edit: 'Edit teacher',
              disable: isActive ? 'Deactivate teacher' : 'Activate teacher',
              delete: 'Delete teacher',
            }}
            titles={{
              edit: 'Edit teacher',
              disable: isActive ? 'Deactivate teacher' : 'Activate teacher',
              delete: 'Delete teacher',
            }}
          />
        </div>
      </div>

      {/* Teacher Details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="truncate" title={phone}>{phone}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{studentCount} {studentCount === 1 ? 'student' : 'students'}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(hourlyRate)}/hr
          </span>
        </div>

        {centers.length > 0 && (
          <div className="flex items-start gap-2 text-slate-600 pt-1">
            <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div className="flex flex-wrap gap-1">
              {centers.slice(0, 2).map((center) => (
                <Badge key={center.id} variant="default" className="text-xs py-0.5 px-1.5">
                  {center.name}
                </Badge>
              ))}
              {centers.length > 2 && (
                <Badge variant="default" className="text-xs py-0.5 px-1.5">
                  +{centers.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {!isActive && (
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


