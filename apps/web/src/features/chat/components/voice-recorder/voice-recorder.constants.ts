export const VOICE_RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
] as const;

export const VOICE_RECORDER_MAX_DURATION_SEC = 300;
export const VOICE_RECORDER_TIMESLICE_MS = 250;
export const VOICE_RECORDER_SILENCE_RMS_THRESHOLD = 0.001;
export const VOICE_RECORDER_MIN_BLOB_SIZE_BYTES = 5000;
