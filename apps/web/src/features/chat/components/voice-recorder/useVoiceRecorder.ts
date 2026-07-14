'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getChatTheme } from '../../lib/chat-theme';
import {
  VOICE_RECORDER_MAX_DURATION_SEC,
  VOICE_RECORDER_MIN_BLOB_SIZE_BYTES,
  VOICE_RECORDER_TIMESLICE_MS,
} from './voice-recorder.constants';
import type { VoiceRecorderProps, VoiceRecorderViewModel } from './voice-recorder.types';
import {
  acquireMicrophoneStream,
  createAudioContext,
  createVoiceMediaRecorder,
  detectBlobSilence,
  ensureAudioContextRunning,
  formatVoiceRecorderDuration,
  getExtensionFromMimeType,
  getSupportedMimeType,
  shouldOmitMediaRecorderTimeslice,
} from './voice-recorder.util';

export function useVoiceRecorder({
  variant = 'default',
  onRecorded,
  onCancel,
}: VoiceRecorderProps): VoiceRecorderViewModel {
  const tChat = useTranslations('chat');
  const ui = getChatTheme(variant);

  const [isRecording, setIsRecording] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micWarning, setMicWarning] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setMicLevel(0);
    setMicWarning(null);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    isRecordingRef.current = false;
    setIsRecording(false);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const handleRecorderStop = useCallback(
    async (mimeType: string) => {
      const recorder = recorderRef.current;
      // Only flush pending timeslice chunks when we used start(timeslice).
      if (
        !shouldOmitMediaRecorderTimeslice() &&
        recorder &&
        recorder.state !== 'inactive' &&
        typeof recorder.requestData === 'function'
      ) {
        try {
          recorder.requestData();
        } catch {
          // Ignore if not supported
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const selectedMimeType = mimeType || recorder?.mimeType || 'audio/mp4';
      const blob = new Blob(chunksRef.current, { type: selectedMimeType });

      if (blob.size === 0) {
        setError(tChat('recordingFailedEmpty'));
        setCanSend(false);
        return;
      }

      const elapsedMs = Date.now() - startedAtRef.current;
      const finalDuration = Math.round(elapsedMs / 1000);

      if (!Number.isFinite(finalDuration) || finalDuration < 1 || finalDuration > VOICE_RECORDER_MAX_DURATION_SEC) {
        setError(tChat('invalidDuration', { seconds: finalDuration }));
        setCanSend(false);
        return;
      }

      let isSilent = await detectBlobSilence(blob, finalDuration);
      if (!isSilent && finalDuration >= 2 && blob.size < VOICE_RECORDER_MIN_BLOB_SIZE_BYTES) {
        isSilent = true;
      }

      if (isSilent) {
        setError(tChat('noAudioCaptured'));
        setCanSend(false);
        return;
      }

      setRecordedBlob(blob);
      setRecordedMimeType(selectedMimeType);
      setDurationSec(finalDuration);
      setPreviewUrl(URL.createObjectURL(blob));
      setCanSend(true);
    },
    [tChat],
  );

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setCanSend(false);
      setMicLevel(0);
      setMicWarning(null);
      chunksRef.current = [];
      setRecordedBlob(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setDurationSec(0);

      if (typeof MediaRecorder === 'undefined') {
        throw new Error(tChat('noSupportedAudioFormat'));
      }

      const stream = await acquireMicrophoneStream();

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) throw new Error(tChat('noAudioTrack'));

      const audioTrack = audioTracks[0];
      if (!audioTrack.enabled) throw new Error(tChat('audioTrackDisabled'));
      if (audioTrack.readyState !== 'live') throw new Error(tChat('audioTrackNotLive'));

      streamRef.current = stream;

      try {
        const audioContext = createAudioContext();
        await ensureAudioContextRunning(audioContext);
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let silenceCount = 0;

        const updateMicLevel = () => {
          if (!analyserRef.current || !isRecordingRef.current) return;

          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const level = Math.min(100, Math.round(rms * 1000));
          setMicLevel(level);

          if (level < 1) {
            silenceCount++;
            if (silenceCount > 10) setMicWarning(tChat('noMicSignal'));
          } else {
            silenceCount = 0;
            setMicWarning(null);
          }

          animationFrameRef.current = requestAnimationFrame(updateMicLevel);
        };

        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      } catch (audioError) {
        console.warn('[VoiceRecorder] Failed to setup audio analysis:', audioError);
      }

      const preferredMimeType = getSupportedMimeType();
      const recorder = createVoiceMediaRecorder(stream, preferredMimeType);
      recorderRef.current = recorder;
      const resolvedMimeType = recorder.mimeType || preferredMimeType || 'audio/mp4';

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        void handleRecorderStop(resolvedMimeType);
      };

      recorder.onerror = (event) => {
        setError(tChat('recordingError'));
        console.error('MediaRecorder error:', event);
      };

      startedAtRef.current = Date.now();
      // Safari/iOS: timeslice often yields empty blobs; collect one final blob on stop.
      if (shouldOmitMediaRecorderTimeslice()) {
        recorder.start();
      } else {
        recorder.start(VOICE_RECORDER_TIMESLICE_MS);
      }
      isRecordingRef.current = true;
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
        setDurationSec(elapsed);
        if (elapsed >= VOICE_RECORDER_MAX_DURATION_SEC) stopRecording();
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : tChat('failedStartRecording');
      if (message.includes('permission') || message.includes('Permission')) {
        setError(tChat('micPermissionDenied'));
      } else if (message.includes('device') || message.includes('not found')) {
        setError(tChat('noMicrophoneFound'));
      } else {
        setError(message);
      }
      cleanup();
    }
  }, [cleanup, handleRecorderStop, stopRecording, tChat]);

  const handleSend = useCallback(async () => {
    if (!recordedBlob || !canSend || isSending) return;

    const ext = getExtensionFromMimeType(recordedMimeType);
    const file = new File([recordedBlob], `voice-${Date.now()}.${ext}`, { type: recordedMimeType });

    setIsSending(true);
    setCanSend(false);

    try {
      await Promise.resolve(onRecorded(file, durationSec, recordedMimeType));
      setRecordedBlob(null);
      setRecordedMimeType('');
      setDurationSec(0);
      cleanup();
    } catch (err) {
      setCanSend(true);
      setError(err instanceof Error ? err.message : tChat('sendVoiceFailed'));
    } finally {
      setIsSending(false);
    }
  }, [recordedBlob, canSend, isSending, durationSec, recordedMimeType, onRecorded, cleanup, tChat]);

  return {
    ui,
    isRecording,
    durationSec,
    previewUrl,
    recordedBlob,
    error,
    canSend,
    isSending,
    micLevel,
    micWarning,
    startRecording,
    stopRecording,
    handleSend,
    onCancel,
    formatDuration: formatVoiceRecorderDuration,
    setError,
  };
}
