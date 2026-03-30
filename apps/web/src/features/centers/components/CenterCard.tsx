import { Pencil, Trash2, Ban, Building2, MapPin, Phone, Mail, Users } from 'lucide-react';
import type { CenterWithCount } from '../types';
import { getContrastColor } from '@/shared/lib/utils';

interface CenterCardProps {
  center: CenterWithCount;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function CenterCard({ center, onEdit, onDelete, onToggleActive }: CenterCardProps) {
  const primaryColor = center.colorHex || '#253046';
  const titleColor = getContrastColor(primaryColor) === 'white' ? 'text-white' : 'text-slate-900';

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: primaryColor }}
        aria-hidden
      />

      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            {!center.isActive && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Inactive
              </span>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Building2 className={`w-4 h-4 ${titleColor}`} />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm leading-tight truncate">
                {center.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              aria-label="Edit center"
              title="Edit center"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Delete center"
              title="Delete center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleActive}
              className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              aria-label={center.isActive ? 'Deactivate center' : 'Activate center'}
              title={center.isActive ? 'Deactivate center' : 'Activate center'}
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {center.address && (
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="line-clamp-2" title={center.address}>
              {center.address}
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
        {center.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate" title={center.phone}>{center.phone}</span>
          </div>
        )}

        {center.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate" title={center.email}>{center.email}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-600">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {center._count?.groups || 0} {center._count?.groups === 1 ? 'group' : 'groups'}
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}

