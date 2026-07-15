import type { PLAYBACK_SPEED_OPTIONS } from './voice-message-player.constants';

export type PlaybackSpeed = (typeof PLAYBACK_SPEED_OPTIONS)[number];

export type VoiceMessagePlayerVariant = 'default' | 'toTeacher';

export interface VoiceMessagePlayerProps {
  fileUrl: string;
  duration?: number;
  fileName?: string;
  variant?: VoiceMessagePlayerVariant;
}
