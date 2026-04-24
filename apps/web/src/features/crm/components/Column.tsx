'use client';

import { Mic } from 'lucide-react';
import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { LeadCard } from './LeadCard';
import { STATUS_LABELS } from './LeadCard';
import type { CrmBranchOption } from './CrmBranchSelector';

interface ColumnProps {
  status: CrmLeadStatus;
  leads: CrmLead[];
  count: number;
  availableStatuses?: CrmLeadStatus[];
  onCardClick: (lead: CrmLead) => void;
  onCardStatusChange?: (leadId: string, status: CrmLeadStatus) => void;
  onCardBranchChange?: (leadId: string, centerId: string | null) => void;
  changingStatusId?: string | null;
  changingBranchId?: string | null;
  onAddClick: () => void;
  /** When true (admin), NEW column shows the voice-lead button; managers get no header action. */
  newLeadAddUsesVoice?: boolean;
  showVoiceRecorder?: (lead: CrmLead) => React.ReactNode;
  branchOptions?: CrmBranchOption[];
  canDeleteLead?: boolean;
  onLeadDeleteRequest?: (lead: CrmLead) => void;
  deleteInProgress?: boolean;
}

export function Column({
  status,
  leads,
  count,
  availableStatuses,
  onCardClick,
  onCardStatusChange,
  onCardBranchChange,
  changingStatusId,
  changingBranchId,
  onAddClick,
  newLeadAddUsesVoice = true,
  showVoiceRecorder,
  branchOptions,
  canDeleteLead,
  onLeadDeleteRequest,
  deleteInProgress,
}: ColumnProps) {
  const label = STATUS_LABELS[status];
  const isNew = status === 'NEW';

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
          {isNew && newLeadAddUsesVoice && (
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
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2 space-y-2">
        {leads.map((lead) => (
          <div key={lead.id} className="space-y-1">
            <LeadCard
              lead={lead}
              availableStatuses={availableStatuses}
              branchOptions={branchOptions}
              onClick={() => onCardClick(lead)}
              onStatusChange={onCardStatusChange}
              onBranchChange={onCardBranchChange}
              isChangingStatus={changingStatusId === lead.id}
              isChangingBranch={changingBranchId === lead.id}
              showDelete={canDeleteLead}
              onDeleteClick={
                canDeleteLead && onLeadDeleteRequest ? () => onLeadDeleteRequest(lead) : undefined
              }
              deleteDisabled={deleteInProgress}
            />
            {showVoiceRecorder && status === 'NEW' && showVoiceRecorder(lead)}
          </div>
        ))}
      </div>
    </div>
  );
}
