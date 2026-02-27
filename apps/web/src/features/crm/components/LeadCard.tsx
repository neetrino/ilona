'use client';

import type { CrmLead, CrmLeadStatus } from '@/features/crm/types';
import { RecordingPlayback } from './VoiceRecorder';
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

export function LeadCard({ lead, onClick, className }: LeadCardProps) {
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <p className="font-medium text-slate-900 truncate">{name}</p>
      {voiceAttachment && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <RecordingPlayback
            r2Key={voiceAttachment.r2Key}
            mimeType={voiceAttachment.mimeType ?? 'audio/webm'}
            className="w-full max-w-full h-8"
          />
        </div>
      )}
      <p className="text-xs text-slate-400 mt-1">{createdAt}</p>
      {recordingTime && <p className="text-xs text-slate-500">{recordingTime}</p>}
      {lead.createdByUser && (
        <p className="text-xs text-slate-500 mt-0.5">
          by {lead.createdByUser.firstName} {lead.createdByUser.lastName}
        </p>
      )}
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
    </button>
  );
}

export { STATUS_LABELS };
