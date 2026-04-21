'use client';

import { Mic } from 'lucide-react';
import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { LeadCard } from './LeadCard';
import { STATUS_LABELS } from './LeadCard';

interface ColumnCenterOption {
  id: string;
  name: string;
}

interface ColumnProps {
  status: CrmLeadStatus;
  leads: CrmLead[];
  count: number;
  availableStatuses?: CrmLeadStatus[];
  onCardClick: (lead: CrmLead) => void;
  onCardEdit?: (lead: CrmLead) => void;
  onCardStatusChange?: (leadId: string, status: CrmLeadStatus) => void;
  changingStatusId?: string | null;
  onAddClick: () => void;
  showVoiceRecorder?: (lead: CrmLead) => React.ReactNode;
  /** Centers shown in the New-column branch dropdown. Empty/undefined hides it. */
  newColumnCenters?: ColumnCenterOption[];
  /** Currently-selected center for the New-column branch dropdown. */
  newColumnCenterId?: string | null;
  onNewColumnCenterChange?: (centerId: string | null) => void;
}

export function Column({
  status,
  leads,
  count,
  availableStatuses,
  onCardClick,
  onCardEdit,
  onCardStatusChange,
  changingStatusId,
  onAddClick,
  showVoiceRecorder,
  newColumnCenters,
  newColumnCenterId,
  onNewColumnCenterChange,
}: ColumnProps) {
  const label = STATUS_LABELS[status];
  const isNew = status === 'NEW';
  const showCenterDropdown = isNew && (newColumnCenters?.length ?? 0) > 0;

  return (
    <div className="min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
      <div className="p-2 sm:p-3 border-b border-slate-200 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-semibold text-slate-800 text-sm truncate">{label}</h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
              {count}
            </span>
          </div>
          {isNew && (
            <button
              type="button"
              onClick={onAddClick}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90"
              title="Record a voice lead"
              aria-label="Record a voice lead"
            >
              <Mic className="size-4" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
        {showCenterDropdown && (
          <select
            value={newColumnCenterId ?? ''}
            onChange={(e) => onNewColumnCenterChange?.(e.target.value || null)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
            aria-label="Branch for new voice leads"
          >
            <option value="">All branches</option>
            {newColumnCenters!.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2 space-y-2">
        {leads.map((lead) => (
          <div key={lead.id} className="space-y-1">
            <LeadCard
              lead={lead}
              availableStatuses={availableStatuses}
              onClick={() => onCardClick(lead)}
              onEditClick={onCardEdit ? () => onCardEdit(lead) : undefined}
              onStatusChange={onCardStatusChange}
              isChangingStatus={changingStatusId === lead.id}
            />
            {showVoiceRecorder && status === 'NEW' && showVoiceRecorder(lead)}
          </div>
        ))}
      </div>
    </div>
  );
}
