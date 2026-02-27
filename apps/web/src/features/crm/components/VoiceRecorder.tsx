'use client';

import { useState, useRef, useCallback } from 'react';
import { getPresignedRecordingUrl, confirmRecording, getRecordingPlayUrl } from '@/features/crm/api/crm.api';
import { cn } from '@/shared/lib/utils';

interface VoiceRecorderProps {
  leadId: string;
  onRecordingSaved?: () => void;
  disabled?: boolean;
  className?: string;
  /** Hide error message on the card (e.g. in board view) */
  hideError?: boolean;
}

export function VoiceRecorder({
  leadId,
  onRecordingSaved,
  disabled,
  className,
  hideError,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length === 0) return;
        setIsUploading(true);
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const ext = mimeType === 'audio/webm' ? 'webm' : 'm4a';
          const fileName = `recording-${Date.now()}.${ext}`;
          const { key, uploadUrl, publicUrl } = await getPresignedRecordingUrl(
            leadId,
            fileName,
            mimeType
          );
          const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': mimeType },
          });
          if (!response.ok) throw new Error('Upload failed');
          await confirmRecording(leadId, key, mimeType, blob.size);
          onRecordingSaved?.();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
          setIsUploading(false);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [leadId, onRecordingSaved]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled || isUploading}
          className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          {isUploading ? (
            <>Uploading…</>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Record
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-300"
        >
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          Stop
        </button>
      )}
      {error && !hideError && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export function RecordingPlayback({
  r2Key: key,
  mimeType,
  className,
}: {
  r2Key: string;
  mimeType: string | null;
  className?: string;
}) {
  const url = getRecordingPlayUrl(key);
  return (
    <audio controls className={cn('w-full max-w-xs', className)} src={url}>
      Your browser does not support audio.
    </audio>
  );
}
