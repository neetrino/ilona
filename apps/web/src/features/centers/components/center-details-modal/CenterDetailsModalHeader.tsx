'use client';

import { Building2, MapPin, X } from 'lucide-react';
import type { CenterDetails } from '../../types';

type CenterDetailsModalHeaderProps = {
  center: CenterDetails['center'] | null;
  onClose: () => void;
  closeLabel: string;
};

export function CenterDetailsModalHeader({ center, onClose, closeLabel }: CenterDetailsModalHeaderProps) {
  const color = center?.colorHex ?? '#253046';
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-4 bg-white px-4 py-[1.125rem] sm:px-6 sm:py-4"
      style={{ borderBottom: '1px solid #e2e8f0' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-black/5 sm:size-10"
          style={{ backgroundColor: color }}
        >
          <Building2 className="size-6 sm:size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-slate-900 sm:text-lg">
            {center?.name ?? '—'}
          </h2>
          {center?.address &&
            center.address.trim().toLowerCase() !== center.name.trim().toLowerCase() && (
            <p className="flex items-center gap-1 truncate text-sm text-slate-500 sm:text-xs">
              <MapPin className="size-3" /> {center.address}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 tablet:inline-flex"
        aria-label={closeLabel}
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
