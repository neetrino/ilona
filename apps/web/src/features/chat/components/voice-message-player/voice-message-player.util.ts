import {
  PLAYBACK_SPEED_OPTIONS,
  VOICE_PLAYBACK_SPEED_KEY_LEGACY,
  VOICE_PLAYBACK_SPEED_KEY_PREFIX,
} from './voice-message-player.constants';
import type { PlaybackSpeed } from './voice-message-player.types';

let activeAudioElement: HTMLAudioElement | null = null;

export function getActiveAudioElement(): HTMLAudioElement | null {
  return activeAudioElement;
}

export function setActiveAudioElement(el: HTMLAudioElement | null): void {
  activeAudioElement = el;
}

export function pauseOtherAudio(current: HTMLAudioElement): void {
  if (activeAudioElement && activeAudioElement !== current) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
  }
}

export function clearActiveAudioIfMatch(el: HTMLAudioElement): void {
  if (activeAudioElement === el) {
    activeAudioElement = null;
  }
}

function getStorageKey(userId: string | null): string | null {
  if (!userId) return null;
  return `${VOICE_PLAYBACK_SPEED_KEY_PREFIX}:${userId}`;
}

export function getStoredPlaybackSpeed(userId: string | null): PlaybackSpeed {
  if (typeof window === 'undefined') return 1;
  const key = getStorageKey(userId);
  if (!key) return 1;
  try {
    const stored = localStorage.getItem(key);
    if (stored != null) {
      const value = Number(stored);
      if (PLAYBACK_SPEED_OPTIONS.includes(value as PlaybackSpeed)) {
        return value as PlaybackSpeed;
      }
    }
    const legacy = localStorage.getItem(VOICE_PLAYBACK_SPEED_KEY_LEGACY);
    if (legacy != null) {
      const value = Number(legacy);
      if (PLAYBACK_SPEED_OPTIONS.includes(value as PlaybackSpeed)) {
        localStorage.setItem(key, legacy);
        return value as PlaybackSpeed;
      }
    }
  } catch {
    // ignore
  }
  return 1;
}

export function persistPlaybackSpeed(userId: string | null, speed: PlaybackSpeed): void {
  const key = getStorageKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, String(speed));
  } catch {
    // ignore
  }
}

export function formatSpeedLabel(speed: PlaybackSpeed): string {
  if (speed === 1.5) return '1,5x';
  return `${speed}x`;
}

export function formatVoiceDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getEffectiveDuration(
  el: HTMLAudioElement | null,
  durationProp?: number,
): number {
  if (el?.duration && isFinite(el.duration) && el.duration > 0) {
    return el.duration;
  }
  if (durationProp != null && durationProp > 0) {
    return durationProp;
  }
  return 0;
}

export function getAudioErrorMessage(error: MediaError): string {
  switch (error.code) {
    case error.MEDIA_ERR_ABORTED:
      return 'Playback aborted';
    case error.MEDIA_ERR_NETWORK:
      return 'Network error - file may not be accessible';
    case error.MEDIA_ERR_DECODE:
      return 'Decode error - file format may not be supported';
    case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'File format not supported';
    default:
      return 'Unknown error';
  }
}

/** Deterministic pseudo-waveform heights (0.18–1) from a seed string. */
export function generateWaveformLevels(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }

  const levels: number[] = [];
  for (let i = 0; i < count; i += 1) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const noise = (hash >>> 0) / 4294967295;
    const envelope = 0.35 + 0.65 * Math.sin((i / count) * Math.PI);
    const midBump = 0.55 + 0.45 * Math.sin((i / count) * Math.PI * 2.4);
    const level = Math.min(1, Math.max(0.18, envelope * midBump * (0.45 + noise * 0.7)));
    levels.push(level);
  }
  return levels;
}
