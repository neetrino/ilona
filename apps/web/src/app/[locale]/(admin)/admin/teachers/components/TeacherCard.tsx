'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/shared/components/ui';
import { formatCurrency, cn } from '@/shared/lib/utils';
import { TeacherShowcaseCard } from '@/features/teachers';
import type { Teacher } from '@/features/teachers';
import type { UserStatus } from '@/types';
import { getTeacherCenters } from '../utils';
import { usePortalSidebarCollapsed } from '@/shared/context/portal-shell-context';
import { Building2, Mail, Users } from 'lucide-react';

interface TeacherCardProps {
  teacher: Teacher;
  onEdit: () => void;
  onCardClick?: (teacher: Teacher) => void;
}

function statusBadgeVariant(status: UserStatus | undefined): 'success' | 'warning' | 'error' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED') return 'error';
  return 'warning';
}

function getRateDigitCount(rate: number): number {
  return Math.floor(Math.abs(rate)).toString().length;
}

function getDesktopStatsGridClass(digitCount: number): string | undefined {
  if (digitCount >= 6) return 'sm:grid-cols-[minmax(0,0.5fr)_minmax(0,1.5fr)]';
  if (digitCount >= 5) return 'sm:grid-cols-[minmax(0,0.58fr)_minmax(0,1.42fr)]';
  return undefined;
}

function InfoRow({
  icon,
  value,
  trailingIcon,
}: {
  icon: ReactNode;
  value: ReactNode;
  trailingIcon?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f6fb] text-[#3b3b40]">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm text-[#3b3b40]">{value}</div>
      {trailingIcon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(14,14,16,0.08)] bg-white text-[#3b3b40]">
          {trailingIcon}
        </span>
      ) : null}
    </div>
  );
}

export function TeacherCard({
  teacher,
  onEdit,
  onCardClick,
}: TeacherCardProps) {
  const t = useTranslations('teachers');
  const tStatus = useTranslations('status');
  const sidebarCollapsed = usePortalSidebarCollapsed();
  const sidebarExpanded = !sidebarCollapsed;

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
          .map((group, index) => (index < groups.length - 1 ? `${group.name},` : group.name))
          .join(' ');
  const firstCenterName = centers[0]?.name ?? t('noBranchAssigned');
  const remainingCentersCount = Math.max(0, centers.length - 1);
  const formattedRate = formatCurrency(hourlyRate);
  const rateDigits = getRateDigitCount(hourlyRate);
  const desktopWideRateGrid = getDesktopStatsGridClass(rateDigits);
  const desktopRateFlex = sidebarExpanded || rateDigits >= 5;

  return (
    <TeacherShowcaseCard
      teacher={teacher}
      onPhotoClick={onCardClick ? () => onCardClick(teacher) : undefined}
      onCardClick={onEdit}
      isMuted={!isActive}
      afterExperience={
        <div className="space-y-3">
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            value={
              <span className="block truncate" title={email}>
                {email}
              </span>
            }
          />
          <InfoRow
            icon={<Users className="h-4 w-4" />}
            value={
              <span className="block truncate" title={groupsSummary}>
                {groupsSummary}
              </span>
            }
          />
          <InfoRow
            icon={<Building2 className="h-4 w-4" />}
            value={
              <span
                className="block truncate"
                title={centers.map((center) => center.name).join(', ') || firstCenterName}
              >
                {firstCenterName}
                {remainingCentersCount > 0 ? (
                  <span className="ml-1 text-[#8b8b90]">and {remainingCentersCount} more</span>
                ) : null}
              </span>
            }
          />
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f6fb] text-[#3b3b40]">
              <Users className="h-4 w-4" />
            </span>
            <span className="text-sm text-[#3b3b40]">{t('status')}</span>
            <Badge variant={statusBadgeVariant(status)} className="text-[11px]">
              {statusLabel}
            </Badge>
          </div>
          <div className={cn('grid grid-cols-2 gap-3 rounded-2xl bg-[#f5f6fb] p-3', desktopWideRateGrid)}>
            <div
              className={cn(
                'min-w-0 border-r border-[rgba(14,14,16,0.08)] pr-3',
                desktopWideRateGrid && 'sm:pr-2',
              )}
            >
              <div className="text-[11px] uppercase tracking-wide text-[#8b8b90]">{t('students')}</div>
              <div className="mt-1 text-2xl font-semibold leading-none text-[#1010a3]">{studentCount}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-[#8b8b90]">{t('rate')}</div>
              <div
                className={cn(
                  'mt-1 truncate text-xl font-semibold leading-none text-[#1f2937]',
                  desktopRateFlex &&
                    cn(
                      'sm:flex sm:min-w-0 sm:items-baseline sm:overflow-visible sm:whitespace-nowrap sm:tabular-nums',
                      sidebarExpanded ? 'sm:text-base lg:sm:text-lg' : 'sm:text-xl',
                    ),
                )}
              >
                <span
                  className={cn(
                    rateDigits >= 5 && 'sm:min-w-0 sm:truncate',
                    sidebarExpanded && rateDigits < 5 && 'sm:shrink-0',
                  )}
                  title={formattedRate}
                >
                  {formattedRate}
                </span>
                <span
                  className={cn(
                    'ml-1 text-sm font-medium text-[#3b3b40]',
                    desktopRateFlex && 'sm:shrink-0',
                    sidebarExpanded && 'sm:text-xs lg:sm:text-sm',
                  )}
                >
                  /hr
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
