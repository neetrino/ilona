'use client';

import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { LeadCard } from './LeadCard';
import { STATUS_LABELS } from './LeadCard';

interface ColumnProps {
  status: CrmLeadStatus;
  leads: CrmLead[];
  count: number;
  onCardClick: (lead: CrmLead) => void;
  onCardEdit?: (lead: CrmLead) => void;
  onCardStatusChange?: (leadId: string, status: CrmLeadStatus) => void;
  changingStatusId?: string | null;
  onAddClick: () => void;
  showVoiceRecorder?: (lead: CrmLead) => React.ReactNode;
}

export function Column({
  status,
  leads,
  count,
  onCardClick,
  onCardEdit,
  onCardStatusChange,
  changingStatusId,
  onAddClick,
  showVoiceRecorder,
}: ColumnProps) {
  const label = STATUS_LABELS[status];

  return (
    <div className="flex-shrink-0 w-72 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800">{label}</h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
            {count}
          </span>
        </div>
        {status === 'NEW' && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90"
            title="Add lead"
          >
            +
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {leads.map((lead) => (
          <div key={lead.id} className="space-y-1">
            <LeadCard
              lead={lead}
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
