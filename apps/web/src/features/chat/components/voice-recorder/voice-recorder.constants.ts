/**
 * Prefer MP4/AAC first: Safari + modern Chromium can record it, and all major
 * browsers can play it. WebM/Opus is last — Safari/iOS cannot play WebM.
 */
export const VOICE_RECORDER_MIME_TYPES = [
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/aac',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
] as const;

export const VOICE_RECORDER_MAX_DURATION_SEC = 300;
export const VOICE_RECORDER_TIMESLICE_MS = 250;
export const VOICE_RECORDER_SILENCE_RMS_THRESHOLD = 0.001;
export const VOICE_RECORDER_MIN_BLOB_SIZE_BYTES = 5000;
