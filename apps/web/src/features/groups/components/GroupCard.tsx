'use client';

import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import type { Group } from '../types';
import { getGroupOccupancyMeta } from '../occupancy';
import { GroupIconDisplay } from '../group-icon-registry';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onStudentClick?: (studentId: string) => void;
  isStatusTogglePending?: boolean;
}

const actionButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-full text-[#3b3b40] hover:bg-[#f3f3f4]';

function GroupCardActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  className,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button type="button" onClick={onEdit} className={actionButtonClass} aria-label={editLabel}>
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" onClick={onDelete} className={actionButtonClass} aria-label={deleteLabel}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function getOccupancyLabelKey(
  status: ReturnType<typeof getGroupOccupancyMeta>['status'],
): 'occupancyFull' | 'occupancyFilling' | 'occupancyRed' {
  if (status === 'full') return 'occupancyFull';
  if (status === 'filling') return 'occupancyFilling';
  return 'occupancyRed';
}

export function GroupCard({
  group,
  onEdit,
  onDelete,
  onToggleActive,
  isStatusTogglePending = false,
}: GroupCardProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const teacherName = group.teacher ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}` : null;
  const studentCount = group._count?.students || 0;
  const occupancy = getGroupOccupancyMeta(studentCount);
  const dotColorClass =
    occupancy.status === 'full'
      ? 'bg-green-500'
      : occupancy.status === 'filling'
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="flex h-full min-w-0 flex-col bg-transparent p-0 shadow-none">
      <div className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0" aria-hidden>
              <GroupIconDisplay iconKey={group.iconKey} size={18} />
            </span>
            <p className="truncate text-[1.125rem] font-semibold text-[#3b3b40]">{group.name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <GroupCardActions
              onEdit={onEdit}
              onDelete={onDelete}
              editLabel={t('editGroup')}
              deleteLabel={t('deleteGroup')}
              className="hidden sm:flex"
            />
            <button
              type="button"
              onClick={onToggleActive}
              disabled={isStatusTogglePending}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                group.isActive ? 'bg-[#22c55e]' : 'bg-slate-300'
              } ${isStatusTogglePending ? 'opacity-60' : ''}`}
              aria-label={group.isActive ? t('deactivateGroup') : t('activateGroup')}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  group.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mx-4 border-t border-[rgba(14,14,16,0.07)]" />

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Image src="/teachers-logo.webp" alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />
            <p className="truncate text-[1.125rem] font-medium text-[#3b3b40]">{teacherName || tCommon('notAssigned')}</p>
          </div>
          <GroupCardActions
            onEdit={onEdit}
            onDelete={onDelete}
            editLabel={t('editGroup')}
            deleteLabel={t('deleteGroup')}
            className="sm:hidden"
          />
        </div>

        <div className="mx-4 border-t border-[rgba(14,14,16,0.07)]" />

        <div className="px-4 py-3">
          {group.level ? (
            <Badge variant="info" className="px-2 py-0.5 text-base">
              {group.level}
            </Badge>
          ) : null}
        </div>

        <div className="min-h-[10rem] flex-1" aria-hidden />

        <div className="border-t border-[rgba(14,14,16,0.07)] px-4 py-3">
          <div className="flex items-center gap-2 text-slate-600">
            <span className={`inline-flex h-3 w-3 rounded-full ${dotColorClass}`} aria-hidden="true" />
            <span className="text-[1.125rem] font-medium text-slate-700">{t(getOccupancyLabelKey(occupancy.status))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
