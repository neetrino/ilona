'use client';

import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { Pencil } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { CrmStatusSelector } from './CrmStatusSelector';
import { CrmBranchSelector, type CrmBranchOption } from './CrmBranchSelector';

interface LeadCardProps {
  lead: CrmLead;
  availableStatuses?: CrmLeadStatus[];
  branchOptions?: CrmBranchOption[];
  onClick: () => void;
  onEditClick?: (e: React.MouseEvent) => void;
  onStatusChange?: (leadId: string, status: CrmLeadStatus) => void;
  onBranchChange?: (leadId: string, centerId: string | null) => void;
  isChangingStatus?: boolean;
  isChangingBranch?: boolean;
  className?: string;
}

function formatRecordingTime(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function LeadCard({
  lead,
  availableStatuses = CRM_COLUMN_ORDER,
  branchOptions = [],
  onClick,
  onEditClick,
  onStatusChange,
  onBranchChange,
  isChangingStatus,
  isChangingBranch,
  className,
}: LeadCardProps) {
  const voiceAttachment = lead.attachments?.find((a) => a.type === 'VOICE_RECORDING');
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || (voiceAttachment ? 'Voice note' : 'No name');
  const createdAt = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const recordingTime = lead.createdAt ? formatRecordingTime(lead.createdAt) : '';

  const handleStatusChange = (status: CrmLeadStatus) => {
    if (status !== lead.status) onStatusChange?.(lead.id, status);
  };
  const handleBranchChange = (centerId: string | null) => {
    if ((lead.centerId ?? null) !== centerId) onBranchChange?.(lead.id, centerId);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={cn(
        'relative w-full min-w-0 rounded-lg border border-slate-200 bg-white p-2 sm:p-3 text-left shadow-sm transition-shadow hover:shadow-md cursor-pointer',
        className
      )}
    >
      {onEditClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(e);
          }}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="Edit lead"
          aria-label="Edit lead"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {/* Top section: name + edit */}
      <p className="font-medium text-slate-900 truncate pr-8">{name}</p>

      {/* Middle section: lead info */}
      <p className="text-xs text-slate-400 mt-1">{createdAt}</p>
      {recordingTime && <p className="text-xs text-slate-500">{recordingTime}</p>}
      {lead.phone && (
        <p className="text-sm text-slate-500 truncate mt-0.5">{lead.phone}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {lead.center?.name && (
          <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {lead.center.name}
          </span>
        )}
        {lead.teacher?.user && (
          <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {lead.teacher.user.firstName} {lead.teacher.user.lastName}
          </span>
        )}
        {lead.group?.name && (
          <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {lead.group.name}
          </span>
        )}
        {lead.levelId && (
          <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {lead.levelId}
          </span>
        )}
        {lead.teacherApprovedAt ? (
          <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
            Approved
          </span>
        ) : lead.transferFlag ? (
          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
            TRANSFER
          </span>
        ) : null}
      </div>

      {/* Bottom section: status + branch controls */}
      {(onStatusChange || onBranchChange) && (
        <div
          className="relative mt-3 pt-3 border-t border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {onStatusChange && (
            <CrmStatusSelector
              value={lead.status}
              options={availableStatuses}
              onChange={handleStatusChange}
              disabled={isChangingStatus}
            />
          )}
          {onBranchChange && (
            <div className="mt-2">
              <CrmBranchSelector
                value={lead.centerId}
                options={branchOptions}
                onChange={handleBranchChange}
                disabled={isChangingBranch}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Re-export for consumers that import from LeadCard
export { STATUS_LABELS } from '@/features/crm/types';
