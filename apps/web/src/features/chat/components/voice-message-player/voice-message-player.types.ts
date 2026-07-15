import type { PLAYBACK_SPEED_OPTIONS } from './voice-message-player.constants';

export type PlaybackSpeed = (typeof PLAYBACK_SPEED_OPTIONS)[number];

export type VoiceMessagePlayerVariant = 'default' | 'toTeacher';

export interface VoiceMessagePlayerHandle {
  play: () => void;
}

export interface VoiceMessagePlayerProps {
  fileUrl: string;
  duration?: number;
  fileName?: string;
  variant?: VoiceMessagePlayerVariant;
  /** Called when playback finishes (e.g. collapse expanded player back to a play control). */
  onEnded?: () => void;
}
