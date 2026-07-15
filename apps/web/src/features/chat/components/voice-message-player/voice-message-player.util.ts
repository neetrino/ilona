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

/** Deterministic pseudo-waveform heights (0.12–1) — varied bar-to-bar like a real voice wave. */
export function generateWaveformLevels(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }

  const nextNoise = () => {
    hash = (hash * 1664525 + 1013904223) | 0;
    return (hash >>> 0) / 4294967295;
  };

  const levels: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / Math.max(1, count - 1);
    // Soft edges so bars stay inside the pill visually.
    const edge = Math.sin(t * Math.PI);
    const edgeSoft = 0.28 + 0.72 * edge;

    // Several overlapping frequencies + strong noise = irregular adjacent heights.
    const a = nextNoise();
    const b = nextNoise();
    const c = nextNoise();
    const spike = a > 0.82 ? 0.35 + b * 0.4 : 0;
    const dip = a < 0.18 ? -0.25 * c : 0;
    const wave =
      0.22 * Math.sin(t * Math.PI * 7.3 + a * 6) +
      0.18 * Math.sin(t * Math.PI * 13.1 + b * 4) +
      0.12 * Math.sin(t * Math.PI * 21.7 + c * 8);

    const raw = edgeSoft * (0.28 + a * 0.55 + wave + spike + dip);
    levels.push(Math.min(1, Math.max(0.12, raw)));
  }
  return levels;
}
