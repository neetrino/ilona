'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ActionButtons, Badge } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib/utils';
import { TeacherShowcaseCard } from '@/features/teachers';
import type { Teacher } from '@/features/teachers';
import type { UserStatus } from '@/types';
import { getTeacherCenters } from '../utils';
import { TeacherBranchDisplay } from './TeacherBranchDisplay';
import { Building2, Mail, Users } from 'lucide-react';

interface TeacherCardProps {
  teacher: Teacher;
  onEdit: () => void;
  onDelete: () => void;
  onDeactivate: () => void;
  onCardClick?: (teacher: Teacher) => void;
}

function statusBadgeVariant(status: UserStatus | undefined): 'success' | 'warning' | 'error' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED') return 'error';
  return 'warning';
}

function AdminMetaRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2 text-[#3b3b40]">
      <span className="mt-0.5 shrink-0 text-[#8b8b90]" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        {children}
      </div>
    </div>
  );
}

export function TeacherCard({
  teacher,
  onEdit,
  onDelete,
  onDeactivate,
  onCardClick,
}: TeacherCardProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');

  const status = teacher.user?.status;
  const isActive = status === 'ACTIVE';
  const email = teacher.user?.email?.trim() || '—';
  const hourlyRate =
    typeof teacher.hourlyRate === 'string'
      ? parseFloat(teacher.hourlyRate)
      : Number(teacher.hourlyRate || 0);
  const studentCount = teacher._count?.students ?? 0;
  const centers = getTeacherCenters(teacher);
  const groups = teacher.groups ?? [];

  const statusLabel =
    status === 'ACTIVE'
      ? tStatus('active')
      : status === 'SUSPENDED'
        ? tStatus('suspended')
        : tStatus('inactive');

  const groupsSummary =
    groups.length === 0
      ? t('noGroups')
      : groups
          .slice(0, 4)
          .map((g) => g.name)
          .join(', ') + (groups.length > 4 ? ` +${groups.length - 4}` : '');

  return (
    <TeacherShowcaseCard
      teacher={teacher}
      onCardClick={onCardClick ? () => onCardClick(teacher) : undefined}
      isMuted={!isActive}
      headerActions={
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
      }
      afterExperience={
        <div className="space-y-2.5 text-xs sm:text-sm">
          <AdminMetaRow icon={<Mail className="h-3.5 w-3.5" />} label={tCommon('email')}>
            <span className="break-all text-[#3b3b40]" title={email}>
              {email}
            </span>
          </AdminMetaRow>
          <AdminMetaRow icon={<Users className="h-3.5 w-3.5" />} label={t('assignedGroups')}>
            <span className="line-clamp-2 text-[#3b3b40]" title={groupsSummary}>
              {groupsSummary}
            </span>
          </AdminMetaRow>
          <AdminMetaRow icon={<Building2 className="h-3.5 w-3.5" />} label={t('center')}>
            <TeacherBranchDisplay centers={centers} t={t} density="default" />
          </AdminMetaRow>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#8b8b90]">
              {t('status')}
            </span>
            <Badge variant={statusBadgeVariant(status)} className="text-[11px]">
              {statusLabel}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-[rgba(14,14,16,0.07)] pt-2 text-[11px] text-[#8b8b90] sm:text-xs">
            <span>
              {t('students')}: <span className="font-medium text-[#3b3b40]">{studentCount}</span>
            </span>
            <span>
              {t('rate')}:{' '}
              <span className="font-medium text-[#3b3b40]">{formatCurrency(hourlyRate)}/hr</span>
            </span>
          </div>
        </div>
      }
    />
  );
}
