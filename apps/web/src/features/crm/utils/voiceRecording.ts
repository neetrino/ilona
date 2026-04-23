type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  onSuccess: (stream: MediaStream) => void,
  onError: (error: unknown) => void
) => void;

type VoiceRecorderErrorCode =
  | 'BROWSER_UNSUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'PERMISSION_DENIED'
  | 'NO_MICROPHONE'
  | 'MICROPHONE_BUSY'
  | 'RECORDER_UNAVAILABLE'
  | 'RECORDING_FAILED'
  | 'UNKNOWN';

export class VoiceRecorderError extends Error {
  public readonly code: VoiceRecorderErrorCode;

  constructor(code: VoiceRecorderErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'VoiceRecorderError';
  }
}

function getLegacyGetUserMedia(): LegacyGetUserMedia | null {
  const legacyNavigator = navigator as Navigator & {
    getUserMedia?: LegacyGetUserMedia;
    webkitGetUserMedia?: LegacyGetUserMedia;
  };
  return legacyNavigator.getUserMedia ?? legacyNavigator.webkitGetUserMedia ?? null;
}

export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    throw new VoiceRecorderError('BROWSER_UNSUPPORTED', 'Voice recording is not available in this environment.');
  }

  if (!window.isSecureContext) {
    throw new VoiceRecorderError(
      'INSECURE_CONTEXT',
      'Microphone access requires HTTPS (secure context).'
    );
  }

  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  };

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyGetUserMedia = getLegacyGetUserMedia();
  if (!legacyGetUserMedia) {
    throw new VoiceRecorderError(
      'BROWSER_UNSUPPORTED',
      'Your browser does not support voice recording.'
    );
  }

  return new Promise((resolve, reject) => {
    legacyGetUserMedia(constraints, resolve, reject);
  });
}

export function selectSupportedAudioMimeType(): string | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ] as const;

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

export function createAudioRecorder(stream: MediaStream, mimeType: string | null): MediaRecorder {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new VoiceRecorderError(
      'RECORDER_UNAVAILABLE',
      'Your browser does not support voice recording.'
    );
  }

  if (mimeType) {
    try {
      return new MediaRecorder(stream, { mimeType });
    } catch (error) {
      console.warn('[CRM Voice] Failed to init MediaRecorder with mime type:', mimeType, error);
    }
  }

  try {
    return new MediaRecorder(stream);
  } catch (error) {
    throw normalizeVoiceRecorderError(error);
  }
}

export function stopStreamTracks(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }
  stream.getTracks().forEach((track) => track.stop());
}

export function getAudioExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('webm')) return 'webm';
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('mp4') || normalized.includes('m4a')) return 'm4a';
  return 'webm';
}

export function normalizeMimeType(value: unknown, fallback = 'audio/webm'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalizedValue = typeof value === 'string' ? value : String(value);
  const base = normalizedValue.split(';')[0];
  if (typeof base !== 'string') {
    return fallback;
  }

  const trimmed = base.trim();
  return trimmed || fallback;
}

export function normalizeVoiceRecorderError(error: unknown): VoiceRecorderError {
  const recorderEvent = error as { error?: unknown };
  if (recorderEvent?.error) {
    return normalizeVoiceRecorderError(recorderEvent.error);
  }

  if (error instanceof VoiceRecorderError) {
    return error;
  }

  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return new VoiceRecorderError(
          'PERMISSION_DENIED',
          'Microphone permission denied. Please allow access and try again.'
        );
      case 'NotFoundError':
      case 'DevicesNotFoundError':
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        return new VoiceRecorderError(
          'NO_MICROPHONE',
          'No microphone found. Please connect a microphone and try again.'
        );
      case 'NotReadableError':
      case 'TrackStartError':
        return new VoiceRecorderError(
          'MICROPHONE_BUSY',
          'Microphone is busy or unavailable. Close other apps using the microphone and retry.'
        );
      case 'AbortError':
        return new VoiceRecorderError(
          'RECORDING_FAILED',
          'Recording was interrupted. Please try again.'
        );
      default:
        return new VoiceRecorderError('UNKNOWN', error.message || 'Voice recording failed.');
    }
  }

  if (error instanceof Error) {
    if (error.name === 'TypeError') {
      return new VoiceRecorderError(
        'BROWSER_UNSUPPORTED',
        'Your browser does not support voice recording.'
      );
    }
    return new VoiceRecorderError('UNKNOWN', error.message);
  }

  return new VoiceRecorderError('UNKNOWN', 'Unexpected voice recording error.');
}
