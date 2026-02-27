'use client';

import { useState } from 'react';
import type { CrmLeadStatus } from '@/features/crm/types';
import { fetchLead, changeLeadStatus, getAllowedTransitions } from '@/features/crm/api/crm.api';
import { STATUS_LABELS } from './LeadCard';
import { VoiceRecorder, RecordingPlayback } from './VoiceRecorder';
import { useQuery } from '@tanstack/react-query';

interface VoiceLeadDetailModalProps {
  leadId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function VoiceLeadDetailModal({
  leadId,
  open,
  onClose,
  onUpdated,
}: VoiceLeadDetailModalProps) {
  const [changingStatus, setChangingStatus] = useState(false);
  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ['crm-lead', leadId],
    queryFn: () => fetchLead(leadId!),
    enabled: !!leadId && open,
  });

  const { data: allowedStatuses = [] } = useQuery({
    queryKey: ['crm-allowed-transitions', lead?.status],
    queryFn: () => getAllowedTransitions(lead!.status),
    enabled: !!lead?.status && open,
  });

  const handleStatusChange = async (newStatus: CrmLeadStatus) => {
    if (!leadId || !lead) return;
    setChangingStatus(true);
    try {
      await changeLeadStatus(leadId, { status: newStatus });
      await refetch();
      onUpdated();
      onClose();
    } finally {
      setChangingStatus(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">Voice lead</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!leadId ? (
            <p className="text-slate-500">No lead selected.</p>
          ) : isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ) : !lead ? (
            <p className="text-slate-500">Lead not found.</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value as CrmLeadStatus)}
                  disabled={changingStatus || allowedStatuses.length === 0}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value={lead.status}>{STATUS_LABELS[lead.status]}</option>
                  {allowedStatuses
                    .filter((s) => s !== lead.status)
                    .map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                </select>
              </div>

              <div className="text-xs text-slate-500">
                Created {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}
                {lead.updatedAt && (
                  <> · Updated {new Date(lead.updatedAt).toLocaleString()}</>
                )}
              </div>

              {lead.status === 'NEW' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Voice recording</label>
                  <VoiceRecorder leadId={lead.id} onRecordingSaved={() => { refetch(); onUpdated(); }} />
                </div>
              )}

              {lead.attachments && lead.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recordings</label>
                  <div className="space-y-2">
                    {lead.attachments.map((a) => (
                      <div key={a.id}>
                        {a.type === 'VOICE_RECORDING' && (
                          <RecordingPlayback r2Key={a.r2Key} mimeType={a.mimeType} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lead.activities && lead.activities.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-800 mb-2">Activity</h3>
                  <ul className="space-y-2">
                    {lead.activities.map((a) => (
                      <li key={a.id} className="text-sm text-slate-600 border-l-2 border-slate-200 pl-3 py-1">
                        {a.type === 'STATUS_CHANGE' && a.payload && (
                          <>Status: {(a.payload as { fromStatus?: string }).fromStatus} → {(a.payload as { toStatus?: string }).toStatus}</>
                        )}
                        {a.type === 'COMMENT' && a.payload && (
                          <>Comment: {(a.payload as { content?: string }).content}</>
                        )}
                        {a.type === 'RECORDING_UPLOADED' && <>Voice recording added</>}
                        {a.type === 'TEACHER_APPROVED' && <>Teacher approved</>}
                        {a.type === 'TEACHER_TRANSFER' && <>Transfer requested</>}
                        <span className="text-slate-400 ml-1">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
