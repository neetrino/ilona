'use client';

import { Building2, MapPin, Phone, Mail, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CenterWithCount } from '../types';
import { cn, formatPhoneForDisplay, getContrastColor } from '@/shared/lib/utils';
import { ActionButtons } from '@/shared/components/ui';
import { usePortalSidebarCollapsed } from '@/shared/context/portal-shell-context';

interface CenterCardProps {
  center: CenterWithCount;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  /** Optional handler for opening the detailed view popup. */
  onOpenDetails?: () => void;
}

export function CenterCard({ center, onEdit, onDelete, onToggleActive, onOpenDetails }: CenterCardProps) {
  const t = useTranslations('centers');
  const locale = useLocale();
  const sidebarCollapsed = usePortalSidebarCollapsed();
  const stackBranchBadge = locale === 'hy' && !sidebarCollapsed;
  const primaryColor = center.colorHex || '#253046';
  const titleColor = getContrastColor(primaryColor) === 'white' ? 'text-white' : 'text-slate-900';
  const groupCount = center._count?.groups || 0;

  const handleCardActivate = () => {
    if (onOpenDetails) onOpenDetails();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onOpenDetails) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetails();
    }
  };

  return (
    <div
      role={onOpenDetails ? 'button' : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      onClick={onOpenDetails ? handleCardActivate : undefined}
      onKeyDown={onOpenDetails ? handleKeyDown : undefined}
      className={`relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${onOpenDetails ? 'cursor-pointer' : ''}`}
    >
      <div
        className="h-2 w-full"
        style={{ backgroundColor: primaryColor }}
        aria-hidden
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                'flex gap-2',
                stackBranchBadge ? 'lg:flex-col lg:items-start' : 'items-center',
              )}
            >
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset"
                style={{
                  backgroundColor: center.isActive ? '#ecfdf3' : '#fffbeb',
                  color: center.isActive ? '#047857' : '#b45309',
                  boxShadow: center.isActive
                    ? 'inset 0 0 0 1px rgba(16, 185, 129, 0.22)'
                    : 'inset 0 0 0 1px rgba(245, 158, 11, 0.24)',
                }}
              >
                {center.isActive ? t('activeStatus') : t('inactiveStatus')}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {t('branch')}
              </span>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <ActionButtons
                onEdit={onEdit}
                onDelete={onDelete}
                onDisable={onToggleActive}
                isActive={center.isActive}
                size="sm"
                ariaLabels={{
                  edit: t('editCenter'),
                  delete: t('deleteCenter'),
                  disable: center.isActive ? t('deactivateCenter') : t('activateCenter'),
                }}
                titles={{
                  edit: t('editCenter'),
                  delete: t('deleteCenter'),
                  disable: center.isActive ? t('deactivateCenter') : t('activateCenter'),
                }}
              />
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: primaryColor }}
            >
              <Building2 className={`h-5 w-5 ${titleColor}`} />
            </div>
            <h4 className="min-w-0 whitespace-nowrap text-[1.02rem] font-semibold leading-tight text-slate-900" title={center.name}>
              {center.name}
            </h4>
          </div>
        </div>

        {center.address && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <p className="line-clamp-2" title={center.address}>
              {center.address}
            </p>
          </div>
        )}

        <div className="mt-auto space-y-2.5 rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/70 p-3 text-xs">
          {center.phone && (
            <div className="flex items-center gap-2 text-slate-600">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200/70">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <span className="truncate" title={formatPhoneForDisplay(center.phone)}>{formatPhoneForDisplay(center.phone)}</span>
            </div>
          )}

          {center.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200/70">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <span className="truncate" title={center.email}>{center.email}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-600">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200/70">
              <Users className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <span className="font-medium text-slate-700">
              {t('groupCount', { count: groupCount })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
