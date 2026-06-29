import { VOICE_RECORDER_MIME_TYPES } from './voice-recorder.constants';

export function getSupportedMimeType(): string | null {
  for (const type of VOICE_RECORDER_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

export function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  return 'webm';
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

export async function detectBlobSilence(blob: Blob, durationSec: number): Promise<boolean> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = createAudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
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
