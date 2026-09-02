'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createLeadFromVoice } from '@/features/crm/api/crm.api';
import type { CrmLead } from '@/features/crm/types';
import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  createAudioRecorder,
  getAudioExtension,
  normalizeMimeType,
  normalizeVoiceRecorderError,
  requestMicrophoneStream,
  selectSupportedAudioMimeType,
  stopStreamTracks,
} from '@/features/crm/utils/voiceRecording';

interface VoiceLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: CrmLead) => void;
  /** Optional pre-selected center for the new voice lead (admin multi-center). */
  centerId?: string | null;
}

export function VoiceLeadModal({ open, onClose, onCreated, centerId }: VoiceLeadModalProps) {
  const t = useTranslations('crm');
  const tc = useTranslations('common');
  const tChat = useTranslations('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');

  // Revoke blob URL on cleanup to avoid memory leaks
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopStreamTracks(streamRef.current);
      streamRef.current = null;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetRecordingState = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    stopStreamTracks(streamRef.current);
    streamRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setHasRecording(false);
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open) {
      resetRecordingState();
    }
  }, [open, resetRecordingState]);

  const startRecording = useCallback(async () => {
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setHasRecording(false);
    try {
      const stream = await requestMicrophoneStream();
      streamRef.current = stream;
      const preferredMimeType = selectSupportedAudioMimeType();
      const recorder = createAudioRecorder(stream, preferredMimeType);
      mimeTypeRef.current = normalizeMimeType(recorder.mimeType || preferredMimeType, 'audio/webm');
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (event) => {
        console.error('[CRM Voice Lead] MediaRecorder error:', event);
        const normalizedError = normalizeVoiceRecorderError(event);
        setError(normalizedError.message);
      };

      recorder.onstop = () => {
        stopStreamTracks(streamRef.current);
        streamRef.current = null;
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setHasRecording(true);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('[CRM Voice Lead] Failed to start recording:', err);
      const normalizedError = normalizeVoiceRecorderError(err);
      setError(normalizedError.message);
      stopStreamTracks(streamRef.current);
      streamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleSave = useCallback(async () => {
    if (chunksRef.current.length === 0) {
      setError(t('noRecordingToSave'));
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const mimeType = mimeTypeRef.current;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = getAudioExtension(mimeType);
      const fileName = `voice-lead-${Date.now()}.${ext}`;
      // Use File so multipart upload sends a proper filename and type (some servers expect it)
      const file = new File([blob], fileName, { type: mimeType });
      const createdLead = await createLeadFromVoice(file, fileName, centerId ?? undefined);
      chunksRef.current = [];
      setHasRecording(false);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      onCreated(createdLead);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedSaveRecording'));
    } finally {
      setIsSaving(false);
    }
  }, [onCreated, onClose, centerId, t]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSaving) {
        onClose();
      }
    },
    [isSaving, onClose],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        sheet={false}
        stackOpen={open}
        className="w-[calc(100%-1.5rem)] max-w-sm gap-0 overflow-hidden rounded-[15px] p-0 sm:w-full"
        overlayClassName="bg-black/50"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (isSaving || isRecording) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isSaving || isRecording) event.preventDefault();
        }}
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {t('newLeadFromVoice')}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-sm text-slate-500">
            {t('recordVoiceToCreateLead')}
          </DialogDescription>
        </div>
        <div className="space-y-4 p-6">
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={() => {
                  void startRecording();
                }}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {tChat('startRecording')}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                {tChat('stopRecording')}
              </button>
            )}
          </div>
          {hasRecording && !isRecording && previewUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">{t('listenThenSend')}</p>
              <audio
                src={previewUrl}
                controls
                className="h-10 w-full"
                style={{ maxHeight: 40 }}
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={cn(
                'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50',
                isSaving && 'opacity-50',
              )}
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={!hasRecording || isSaving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSaving ? t('saving') : tc('save')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
