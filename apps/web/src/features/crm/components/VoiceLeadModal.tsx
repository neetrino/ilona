'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createLeadFromVoice } from '@/features/crm/api/crm.api';
import type { CrmLead } from '@/features/crm/types';
import { cn } from '@/shared/lib/utils';

interface VoiceLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: CrmLead) => void;
  /** Optional pre-selected center for the new lead (used by managers / branch dropdown). */
  centerId?: string | null;
}

export function VoiceLeadModal({ open, onClose, onCreated, centerId }: VoiceLeadModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');

  // Revoke blob URL on cleanup to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setHasRecording(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
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
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [previewUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleSave = useCallback(async () => {
    if (chunksRef.current.length === 0) {
      setError('No recording to save');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const mimeType = mimeTypeRef.current;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.split(';')[0].trim() === 'audio/webm' ? 'webm' : 'm4a';
      const fileName = `voice-lead-${Date.now()}.${ext}`;
      // Use File so multipart upload sends a proper filename and type (some servers expect it)
      const file = new File([blob], fileName, { type: mimeType });
      const createdLead = await createLeadFromVoice(file, fileName, centerId ?? undefined);
      chunksRef.current = [];
      setHasRecording(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      onCreated(createdLead);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  }, [onCreated, onClose, previewUrl, centerId]);

  const handleCancel = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    setIsRecording(false);
    setHasRecording(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    onClose();
  }, [isRecording, onClose, previewUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New lead from voice</h2>
          <p className="text-sm text-slate-500 mt-0.5">Record a voice message to create a lead in NEW.</p>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 p-2">{error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
              >
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
              >
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Stop Recording
              </button>
            )}
          </div>
          {hasRecording && !isRecording && previewUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Listen, then send</p>
              <audio
                src={previewUrl}
                controls
                className="w-full h-10"
                style={{ maxHeight: 40 }}
              >
                Your browser does not support audio playback.
              </audio>
              <p className="text-xs text-slate-500">Play the recording above. If it sounds good, click Save to create the lead.</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className={cn(
                'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50',
                isSaving && 'opacity-50'
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasRecording || isSaving}
              className={cn(
                'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none'
              )}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
