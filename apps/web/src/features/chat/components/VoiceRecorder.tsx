'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';

interface VoiceRecorderProps {
  onRecorded: (file: File, durationSec: number, mimeType: string) => void;
  onCancel: () => void;
  conversationId: string;
}

export function VoiceRecorder({ onRecorded, onCancel, conversationId: _conversationId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [micLevel, setMicLevel] = useState(0); // 0-100
  const [micWarning, setMicWarning] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Select supported mimeType
  const getSupportedMimeType = useCallback((): string | null => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }, []);

  // Get file extension from mimeType
  const getExtensionFromMimeType = (mimeType: string): string => {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
    return 'webm'; // default
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {
        // Ignore errors on close
      });
      audioContextRef.current = null;
    }

    // Clear intervals
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (micLevelIntervalRef.current) {
      clearInterval(micLevelIntervalRef.current);
      micLevelIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Revoke preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setMicLevel(0);
    setMicWarning(null);
  }, [previewUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setCanSend(false);
      setMicLevel(0);
      setMicWarning(null);
      chunksRef.current = [];
      setRecordedBlob(null);
      setPreviewUrl(null);
      setDurationSec(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Validate stream
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track available');
      }

      const audioTrack = audioTracks[0];
      if (!audioTrack.enabled) {
        throw new Error('Audio track is disabled');
      }

      if (audioTrack.readyState !== 'live') {
        throw new Error('Audio track is not live');
      }

      streamRef.current = stream;

      // Setup Web Audio API for microphone level monitoring
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Monitor microphone level using requestAnimationFrame for smooth updates
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let silenceCount = 0;

        const updateMicLevel = () => {
          if (!analyserRef.current || !isRecording) {
            return;
          }

          analyser.getByteTimeDomainData(dataArray);

          // Compute RMS
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const level = Math.min(100, Math.round(rms * 1000)); // Scale to 0-100

          setMicLevel(level);

          // Check for silence
          if (level < 1) {
            silenceCount++;
            if (silenceCount > 10) {
              // ~1 second of silence (assuming 100ms intervals)
              setMicWarning('No microphone signal detected. Check mic permissions/device.');
            }
          } else {
            silenceCount = 0;
            setMicWarning(null);
          }

          animationFrameRef.current = requestAnimationFrame(updateMicLevel);
        };

        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      } catch (audioError) {
        console.warn('[VoiceRecorder] Failed to setup audio analysis:', audioError);
        // Continue without level meter
      }

      // Get supported mimeType
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType,
      });

      recorderRef.current = recorder;

      // Collect chunks
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Request data if supported
        if (recorder.state !== 'inactive' && 'requestData' in recorder && typeof (recorder as MediaRecorder & { requestData: () => void }).requestData === 'function') {
          try {
            (recorder as MediaRecorder & { requestData: () => void }).requestData();
          } catch (e) {
            // Ignore if not supported
          }
        }

        // Wait a bit for final chunks
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create blob
        const selectedMimeType = mimeType || recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });

        // Validate blob
        if (blob.size === 0) {
          setError('Recording failed (empty)');
          setCanSend(false);
          return;
        }

        // Calculate duration using timestamps (must never be Infinity/NaN)
        const now = Date.now();
        const startedAt = startedAtRef.current;
        const elapsedMs = now - startedAt;
        const finalDuration = Math.round(elapsedMs / 1000);

        // Validate duration
        if (!Number.isFinite(finalDuration) || finalDuration < 1 || finalDuration > 300) {
          setError(`Invalid duration: ${finalDuration} seconds`);
          setCanSend(false);
          return;
        }

        // Silence detection using Web Audio API
        let isSilent = false;
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Compute RMS for first 1-2 seconds
          const sampleRate = audioBuffer.sampleRate;
          const channelData = audioBuffer.getChannelData(0);
          const samplesToCheck = Math.min(sampleRate * 2, channelData.length); // First 2 seconds

          let sum = 0;
          for (let i = 0; i < samplesToCheck; i++) {
            sum += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sum / samplesToCheck);

          // Threshold: very low RMS indicates silence
          if (rms < 0.001) {
            isSilent = true;
          }

          audioContext.close();
        } catch (decodeError) {
          console.warn('[VoiceRecorder] Failed to decode audio for silence detection:', decodeError);
          // Fallback to size-based detection
          if (finalDuration >= 2 && blob.size < 5000) {
            isSilent = true;
          }
        }

        // Fallback: size-based detection
        if (!isSilent && finalDuration >= 2 && blob.size < 5000) {
          isSilent = true;
        }

        if (isSilent) {
          setError('No audio captured. Please check your microphone device.');
          setCanSend(false);
          return;
        }

        // Store recorded data
        setRecordedBlob(blob);
        setRecordedMimeType(selectedMimeType);
        setDurationSec(finalDuration);

        // Create preview URL
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Enable send if all validations pass
        setCanSend(true);
      };

      recorder.onerror = (event) => {
        setError('Recording error occurred');
        console.error('MediaRecorder error:', event);
      };

      // Start recording with timeslice
      startedAtRef.current = Date.now();
      recorder.start(250);
      setIsRecording(true);

      // Update duration every second
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
        setDurationSec(elapsed);

        // Auto-stop at 5 minutes (300 seconds)
        if (elapsed >= 300) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      if (message.includes('permission') || message.includes('Permission')) {
        setError('Microphone permission denied. Please allow microphone access and try again.');
      } else if (message.includes('device') || message.includes('not found')) {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(message);
      }
      cleanup();
    }
  }, [getSupportedMimeType, cleanup]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop tracks (but keep stream for preview)
    // We'll stop tracks in cleanup when component unmounts or new recording starts
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    if (!recordedBlob || !canSend) return;

    // Create File with correct extension
    const ext = getExtensionFromMimeType(recordedMimeType);
    const fileName = `voice-${Date.now()}.${ext}`;
    const file = new File([recordedBlob], fileName, { type: recordedMimeType });

    onRecorded(file, durationSec, recordedMimeType);
    cleanup();
  }, [recordedBlob, canSend, durationSec, recordedMimeType, onRecorded, cleanup]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <div className="flex items-center gap-3">
        {/* Record button */}
        {!isRecording && !recordedBlob && (
          <button
            onClick={startRecording}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex-shrink-0"
            title="Start recording"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
          </button>
        )}

        {/* Stop button */}
        {isRecording && (
          <>
            <button
              onClick={stopRecording}
              className="p-3 bg-slate-600 text-white rounded-full hover:bg-slate-700 transition-colors flex-shrink-0"
              title="Stop recording"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-700">
                  Recording... {formatDuration(durationSec)}
                </span>
              </div>
              {/* Microphone level meter */}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-slate-500">Mic level:</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-100',
                      micLevel > 10 ? 'bg-green-500' : micLevel > 5 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(100, micLevel)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{micLevel}%</span>
              </div>
            </div>
          </>
        )}

        {/* Preview and controls */}
        {recordedBlob && !isRecording && (
          <>
            <div className="flex-1 flex items-center gap-3">
              {/* Audio preview */}
              {previewUrl && (
                <audio
                  src={previewUrl}
                  controls
                  preload="metadata"
                  className="flex-1 h-10"
                  style={{ minWidth: '200px' }}
                  onError={(e) => {
                    console.error('[VoiceRecorder] Preview playback error:', e);
                    setError('Preview playback failed. Please try recording again.');
                  }}
                />
              )}
              <span className="text-sm text-slate-600">{formatDuration(durationSec)}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  canSend
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                )}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* Microphone warning */}
      {micWarning && (
        <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
          {micWarning}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
