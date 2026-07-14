import { VOICE_RECORDER_MIME_TYPES } from './voice-recorder.constants';

export function getSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  // Older WebKit exposed MediaRecorder without isTypeSupported; mp4 is the only option.
  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return 'audio/mp4';
  }

  for (const type of VOICE_RECORDER_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return undefined;
}

export function createVoiceMediaRecorder(
  stream: MediaStream,
  mimeType: string | undefined,
): MediaRecorder {
  if (mimeType) {
    try {
      return new MediaRecorder(stream, { mimeType });
    } catch {
      // Fall through to browser default container/codec.
    }
  }
  return new MediaRecorder(stream);
}

/**
 * Small timeslice values produce empty/corrupt blobs on Safari/iOS WebKit.
 * Collect a single blob on stop instead.
 */
export function shouldOmitMediaRecorderTimeslice(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  // All iOS browsers (incl. Chrome/Firefox) use WebKit MediaRecorder.
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS reports as MacIntel with touch.
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  // Desktop Safari only (exclude Chromium/Firefox/Edge).
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Android/i.test(ua);
}

export function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) {
    return 'm4a';
  }
  return 'm4a';
}

export function formatVoiceRecorderDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type AudioContextConstructor = new (contextOptions?: AudioContextOptions) => AudioContext;

function resolveAudioContextConstructor(): AudioContextConstructor {
  const w = globalThis as typeof globalThis & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) {
    throw new Error('AudioContext is not supported');
  }
  return Ctor;
}

export function createAudioContext(): AudioContext {
  const Ctor = resolveAudioContextConstructor();
  return new Ctor();
}

export async function ensureAudioContextRunning(audioContext: AudioContext): Promise<void> {
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch {
      // iOS may keep it suspended until a later gesture; recording can continue.
    }
  }
}

export async function acquireMicrophoneStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone is not supported in this browser');
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch {
    // Safari/iOS sometimes rejects advanced constraints; plain audio still works.
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

export async function detectBlobSilence(blob: Blob, durationSec: number): Promise<boolean> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = createAudioContext();
    await ensureAudioContextRunning(audioContext);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const samplesToCheck = Math.min(sampleRate * 2, channelData.length);

    let sum = 0;
    for (let i = 0; i < samplesToCheck; i++) {
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / samplesToCheck);
    await audioContext.close();
    return rms < 0.001;
  } catch {
    return durationSec >= 2 && blob.size < 5000;
  }
}
