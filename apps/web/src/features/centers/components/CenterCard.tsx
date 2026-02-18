import { Pencil, Trash2, Ban } from 'lucide-react';
import type { CenterWithCount } from '../types';

interface CenterCardProps {
  center: CenterWithCount;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function CenterCard({ center, onEdit, onDelete, onToggleActive }: CenterCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight flex-1">
            {center.name}
          </h4>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
          <p className="text-xs text-slate-500 line-clamp-2 mt-1" title={center.address}>
            {center.address}
          </p>
        )}
      </div>

      <div className="space-y-2 text-xs">
        {center.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="truncate" title={center.phone}>{center.phone}</span>
          </div>
        )}

        {center.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate" title={center.email}>{center.email}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>
            {center._count?.groups || 0} {center._count?.groups === 1 ? 'group' : 'groups'}
          </span>
        </div>

        {!center.isActive && (
          <div className="pt-1">
            <span className="text-xs text-amber-600 font-medium">Inactive</span>
          </div>
        )}
      </div>
    </div>
  );
}

