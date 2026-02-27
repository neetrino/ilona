'use client';

import { useState, useRef, useEffect } from 'react';
import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { CRM_COLUMN_ORDER } from '@/features/crm/types';
import { Pencil, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const STATUS_LABELS: Record<CrmLeadStatus, string> = {
  NEW: 'New',
  AGREED: 'Agreed',
  FIRST_LESSON: 'First Lesson',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  WAITLIST: 'Waitlist',
  ARCHIVE: 'Archive',
};

interface LeadCardProps {
  lead: CrmLead;
  onClick: () => void;
  onEditClick?: (e: React.MouseEvent) => void;
  onStatusChange?: (leadId: string, status: CrmLeadStatus) => void;
  isChangingStatus?: boolean;
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

export function LeadCard({ lead, onClick, onEditClick, onStatusChange, isChangingStatus, className }: LeadCardProps) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusDropdownOpen]);

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

  const handleStatusSelect = (e: React.MouseEvent, status: CrmLeadStatus) => {
    e.stopPropagation();
    if (status !== lead.status) onStatusChange?.(lead.id, status);
    setStatusDropdownOpen(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={cn(
        'relative w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md cursor-pointer',
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
        {lead.transferFlag && (
          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
            TRANSFER
          </span>
        )}
      </div>

      {/* Bottom section: status change control */}
      {onStatusChange && (
        <div
          ref={statusDropdownRef}
          className="relative mt-3 pt-3 border-t border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStatusDropdownOpen((open) => !open);
            }}
            disabled={isChangingStatus}
            className={cn(
              'w-full inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20',
              isChangingStatus && 'opacity-60 pointer-events-none'
            )}
            title="Change status"
            aria-label="Change status"
            aria-expanded={statusDropdownOpen}
          >
            <span>{STATUS_LABELS[lead.status]}</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform', statusDropdownOpen && 'rotate-180')} />
          </button>
          {statusDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {CRM_COLUMN_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={(e) => handleStatusSelect(e, status)}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50',
                    lead.status === status && 'bg-primary/10 font-medium text-primary'
                  )}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { STATUS_LABELS };
