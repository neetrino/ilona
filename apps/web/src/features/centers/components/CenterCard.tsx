import { Building2, MapPin, Phone, Mail, Users } from 'lucide-react';
import type { CenterWithCount } from '../types';
import { getContrastColor } from '@/shared/lib/utils';
import { ActionButtons } from '@/shared/components/ui';

interface CenterCardProps {
  center: CenterWithCount;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  /** Optional handler for opening the detailed view popup. */
  onOpenDetails?: () => void;
}

export function CenterCard({ center, onEdit, onDelete, onToggleActive, onOpenDetails }: CenterCardProps) {
  const primaryColor = center.colorHex || '#253046';
  const titleColor = getContrastColor(primaryColor) === 'white' ? 'text-white' : 'text-slate-900';

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
      className={`group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${onOpenDetails ? 'cursor-pointer' : ''}`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ backgroundColor: primaryColor }}
        aria-hidden
      />
      <div
        className="h-2 w-full"
        style={{ backgroundColor: primaryColor }}
        aria-hidden
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
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
                {center.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Branch
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5"
                style={{ backgroundColor: primaryColor }}
              >
                <Building2 className={`h-5 w-5 ${titleColor}`} />
              </div>
              <h4 className="truncate text-base font-semibold leading-tight text-slate-900">
                {center.name}
              </h4>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
          <ActionButtons
            onEdit={onEdit}
            onDelete={onDelete}
            onDisable={onToggleActive}
            isActive={center.isActive}
            size="sm"
            ariaLabels={{
              edit: 'Edit center',
              delete: 'Delete center',
              disable: center.isActive ? 'Deactivate center' : 'Activate center',
            }}
            titles={{
              edit: 'Edit center',
              delete: 'Delete center',
              disable: center.isActive ? 'Deactivate center' : 'Activate center',
            }}
          />
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
              <span className="truncate" title={center.phone}>{center.phone}</span>
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
              {center._count?.groups || 0} {center._count?.groups === 1 ? 'group' : 'groups'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

