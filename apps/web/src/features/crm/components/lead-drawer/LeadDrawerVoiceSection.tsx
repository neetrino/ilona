'use client';

import { useTranslations } from 'next-intl';
import type { CrmLead } from '@/features/crm/types';
import { VoiceRecorder, RecordingPlayback } from '../VoiceRecorder';

interface LeadDrawerVoiceSectionProps {
  lead: CrmLead;
  isAdmin: boolean;
  onRecordingSaved: () => void;
}

export function LeadDrawerVoiceSection({ lead, isAdmin, onRecordingSaved }: LeadDrawerVoiceSectionProps) {
  const t = useTranslations('crm');
  const voiceAttachments = lead.attachments?.filter((a) => a.type === 'VOICE_RECORDING') ?? [];

  return (
    <>
      {voiceAttachments.length > 0 && (
        <div className="pb-4 border-b border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">{t('voiceRecording')}</label>
          <div className="space-y-2">
            {voiceAttachments.map((a) => (
              <div key={a.id}>
                <RecordingPlayback
                  r2Key={a.r2Key}
                  mimeType={a.mimeType ?? 'audio/webm'}
                  className="w-full max-w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500">
        {t('created')}{' '}
        {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}
        {lead.updatedAt && (
          <>
            {' '}
            · {t('updated')} {new Date(lead.updatedAt).toLocaleString()}
          </>
        )}
      </div>

      {isAdmin && lead.status === 'NEW' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('voiceRecording')}</label>
          <VoiceRecorder leadId={lead.id} onRecordingSaved={onRecordingSaved} />
        </div>
      )}
    </>
  );
}
