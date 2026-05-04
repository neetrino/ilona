'use client';

import { useState, useRef, useEffect } from 'react';
import { getProxiedFileUrl } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';

const VOICE_SEEK_SKIP_SECONDS = 5;

const PLAYBACK_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
type PlaybackSpeed = (typeof PLAYBACK_SPEED_OPTIONS)[number];
let activeAudioElement: HTMLAudioElement | null = null;

/** Per-user localStorage key to avoid speed preference leaking across accounts. */
const VOICE_PLAYBACK_SPEED_KEY_PREFIX = 'ilona-voice-playback-speed';
/** Legacy global key – only used for one-time migration into user-scoped key. */
const VOICE_PLAYBACK_SPEED_KEY_LEGACY = 'ilona-voice-playback-speed';

function getStorageKey(userId: string | null): string | null {
  if (!userId) return null;
  return `${VOICE_PLAYBACK_SPEED_KEY_PREFIX}:${userId}`;
}

function getStoredPlaybackSpeed(userId: string | null): PlaybackSpeed {
  if (typeof window === 'undefined') return 1;
  const key = getStorageKey(userId);
  if (!key) return 1; // Not logged in: always default
  try {
    const stored = localStorage.getItem(key);
    if (stored != null) {
      const value = Number(stored);
      if (PLAYBACK_SPEED_OPTIONS.includes(value as PlaybackSpeed)) {
        return value as PlaybackSpeed;
      }
    }
    // One-time migration: if user has no saved speed, copy from legacy global key then stop using it
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

function formatSpeedLabel(speed: PlaybackSpeed): string {
  return speed === 1 ? '1x' : `${speed}x`;
}

interface VoiceMessagePlayerProps {
  fileUrl: string;
  duration?: number;
  fileName?: string;
}

export function VoiceMessagePlayer({
  fileUrl,
  duration: durationProp,
  fileName: _fileName,
}: VoiceMessagePlayerProps) {
  const { user } = useAuthStore();
  const userId = user?.id ?? null;
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  /** Progress 0–100 for the progress bar; reset to 0 when starting playback. */
  const [progress, setProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  /** Total length for UI when metadata loads (fallback if durationProp missing). */
  const [mediaDurationSec, setMediaDurationSec] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  // Hydrate speed from user-scoped localStorage on mount and when user changes (login/logout)
  useEffect(() => {
    setPlaybackSpeed(getStoredPlaybackSpeed(userId));
  }, [userId]);

  // Convert R2 URLs to API proxy URLs to avoid CORS issues (must be before effects that use it)
  const proxiedUrl = getProxiedFileUrl(fileUrl) || fileUrl;

  // Apply playbackRate to audio element whenever speed or element changes; does not reset position
  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Cleanup shared active element pointer when this instance unmounts.
  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (activeAudioElement === audioEl) {
        activeAudioElement = null;
      }
    };
  }, []);

  // When the audio source changes, reset position and progress bar to beginning
  useEffect(() => {
    const el = audioRef.current;
    if (el && proxiedUrl) {
      el.currentTime = 0;
      setProgress(0);
      setCurrentTimeSec(0);
      setMediaDurationSec(0);
    }
  }, [proxiedUrl]);

  const getEffectiveDuration = (el: HTMLAudioElement | null): number => {
    if (el?.duration && isFinite(el.duration) && el.duration > 0) {
      return el.duration;
    }
    if (durationProp != null && durationProp > 0) {
      return durationProp;
    }
    return 0;
  };

  const seekToRatio = (ratio: number) => {
    const el = audioRef.current;
    if (!el || isLoading) return;
    const dur = getEffectiveDuration(el);
    if (dur <= 0) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    el.currentTime = clamped * dur;
    setProgress(clamped * 100);
    setCurrentTimeSec(el.currentTime);
  };

  const seekFromClientX = (clientX: number) => {
    const track = progressTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = (clientX - rect.left) / rect.width;
    seekToRatio(ratio);
  };

  const seekBySeconds = (delta: number) => {
    const el = audioRef.current;
    if (!el || isLoading) return;
    const dur = getEffectiveDuration(el);
    if (dur <= 0) return;
    const next = Math.max(0, Math.min(dur, el.currentTime + delta));
    el.currentTime = next;
    setProgress((next / dur) * 100);
    setCurrentTimeSec(next);
  };

  const endScrubbing = (target: HTMLDivElement, pointerId: number) => {
    isScrubbingRef.current = false;
    setIsScrubbing(false);
    try {
      target.releasePointerCapture(pointerId);
    } catch {
      // already released
    }
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    isScrubbingRef.current = true;
    setIsScrubbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    seekFromClientX(e.clientX);
  };

  const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    endScrubbing(e.currentTarget, e.pointerId);
  };

  const handleProgressPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    endScrubbing(e.currentTarget, e.pointerId);
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isLoading) return;
    const step = 0.05;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      seekToRatio(progress / 100 - step);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      seekToRatio(progress / 100 + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      seekToRatio(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      seekToRatio(1);
    }
  };

  // Format duration for voice messages (seconds to MM:SS)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    const error = audio.error;
    
    if (error) {
      let errorMessage = 'Unknown error';
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Playback aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error - file may not be accessible';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Decode error - file format may not be supported';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'File format not supported';
          break;
      }
      
      console.warn('[ChatWindow] Voice playback error:', {
        code: error.code,
        message: errorMessage,
        fileUrl: proxiedUrl.substring(0, 100), // Log first 100 chars only
      });
    }
    
    setHasError(true);
    setIsLoading(false);
  };

  const syncDurationFromElement = () => {
    const el = audioRef.current;
    if (el?.duration && isFinite(el.duration) && el.duration > 0) {
      setMediaDurationSec(el.duration);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
    syncDurationFromElement();
  };

  const handlePlay = () => {
    const currentAudio = audioRef.current;
    if (currentAudio && activeAudioElement && activeAudioElement !== currentAudio) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    }
    activeAudioElement = currentAudio;
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (activeAudioElement === audioRef.current) {
      activeAudioElement = null;
    }
    setIsPlaying(false);
  };

  const handleEnded = () => {
    if (activeAudioElement === audioRef.current) {
      activeAudioElement = null;
    }
    setIsPlaying(false);
    const el = audioRef.current;
    const dur = getEffectiveDuration(el);
    if (dur > 0) {
      setProgress(100);
      setCurrentTimeSec(dur);
    }
  };

  /** Update progress bar from current playback position (smooth, real-time). */
  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el || isScrubbingRef.current) return;
    const duration = el.duration;
    if (duration && isFinite(duration) && duration > 0) {
      setProgress((el.currentTime / duration) * 100);
      setCurrentTimeSec(el.currentTime);
    } else if (durationProp != null && durationProp > 0) {
      setProgress((el.currentTime / durationProp) * 100);
      setCurrentTimeSec(el.currentTime);
    }
  };

  /** Play from current position (after seek / pause); restart only if clip has ended. */
  const handlePlayClick = () => {
    const el = audioRef.current;
    if (!el) return;

    // Stop any previously playing voice message before starting this one.
    if (activeAudioElement && activeAudioElement !== el) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    }

    const dur = getEffectiveDuration(el);
    if (dur > 0 && el.currentTime >= dur - 0.15) {
      el.currentTime = 0;
      setProgress(0);
      setCurrentTimeSec(0);
    }

    el.play().catch(() => {});
  };

  const handlePauseClick = () => {
    audioRef.current?.pause();
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  // Try to reload on error (with retry limit)
  const handleRetry = () => {
    if (audioRef.current) {
      setHasError(false);
      setIsLoading(true);
      setProgress(0);
      audioRef.current.load();
    }
  };

  const cyclePlaybackSpeed = () => {
    const idx = PLAYBACK_SPEED_OPTIONS.indexOf(playbackSpeed);
    const next = PLAYBACK_SPEED_OPTIONS[(idx + 1) % PLAYBACK_SPEED_OPTIONS.length];
    setPlaybackSpeed(next);
    const key = getStorageKey(userId);
    if (key) {
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // ignore
      }
    }
  };

  const totalLabelSec =
    durationProp != null && durationProp > 0 ? durationProp : mediaDurationSec;

  if (hasError) {
    return (
      <div className="flex items-center gap-3 min-w-[200px] p-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex-shrink-0 text-red-500">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs text-red-700 font-medium">Unable to play audio</p>
          <p className="text-xs text-red-600">File may be missing or inaccessible</p>
        </div>
        <button
          onClick={handleRetry}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          title="Retry loading audio"
        >
          Retry
        </button>
        {durationProp != null && (
          <span className="text-xs text-red-600 flex-shrink-0">
            {formatDuration(durationProp)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0 w-full flex-wrap">
      <div className="flex-shrink-0">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </div>
      <div className="flex-1 relative min-w-[200px] max-w-[280px]">
        <audio
          ref={audioRef}
          src={proxiedUrl}
          preload="metadata"
          className="sr-only"
          onError={handleError}
          onCanPlay={handleCanPlay}
          onLoadStart={handleLoadStart}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={syncDurationFromElement}
          crossOrigin="anonymous"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isPlaying ? handlePauseClick : handlePlayClick}
            disabled={isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 touch-manipulation"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => seekBySeconds(-VOICE_SEEK_SKIP_SECONDS)}
            disabled={isLoading}
            className="flex-shrink-0 min-w-[2.25rem] h-8 px-1 rounded-full bg-slate-700/80 text-white text-[10px] font-semibold leading-none flex items-center justify-center hover:bg-slate-600 disabled:opacity-40 touch-manipulation"
            title={`Back ${VOICE_SEEK_SKIP_SECONDS} seconds`}
            aria-label={`Rewind ${VOICE_SEEK_SKIP_SECONDS} seconds`}
          >
            −{VOICE_SEEK_SKIP_SECONDS}
          </button>
          <button
            type="button"
            onClick={() => seekBySeconds(VOICE_SEEK_SKIP_SECONDS)}
            disabled={isLoading}
            className="flex-shrink-0 min-w-[2.25rem] h-8 px-1 rounded-full bg-slate-700/80 text-white text-[10px] font-semibold leading-none flex items-center justify-center hover:bg-slate-600 disabled:opacity-40 touch-manipulation"
            title={`Forward ${VOICE_SEEK_SKIP_SECONDS} seconds`}
            aria-label={`Forward ${VOICE_SEEK_SKIP_SECONDS} seconds`}
          >
            +{VOICE_SEEK_SKIP_SECONDS}
          </button>
          <div className="flex-1 min-w-0">
            <div
              ref={progressTrackRef}
              role="slider"
              tabIndex={0}
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Playback position; drag or use arrow keys to seek"
              className="relative py-2 -my-1 cursor-pointer touch-manipulation group"
              onPointerDown={handleProgressPointerDown}
              onPointerMove={handleProgressPointerMove}
              onPointerUp={handleProgressPointerUp}
              onPointerCancel={handleProgressPointerCancel}
              onKeyDown={handleProgressKeyDown}
            >
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden pointer-events-none">
                <div
                  className={cn(
                    'h-full bg-primary rounded-full group-focus-within:ring-2 group-focus-within:ring-primary/40',
                    !isScrubbing && 'transition-[width] duration-75 ease-linear'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded pointer-events-none">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={cyclePlaybackSpeed}
        className="flex-shrink-0 min-w-[2.75rem] py-1.5 px-2.5 text-sm font-semibold rounded-lg bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-colors touch-manipulation"
        title={`Playback speed: ${formatSpeedLabel(playbackSpeed)}. Click to change.`}
        aria-label={`Playback speed ${formatSpeedLabel(playbackSpeed)}`}
      >
        {formatSpeedLabel(playbackSpeed)}
      </button>
      {totalLabelSec > 0 ? (
        <span className="text-sm font-semibold flex-shrink-0 text-slate-500 tabular-nums whitespace-nowrap">
          {formatDuration(currentTimeSec)} / {formatDuration(totalLabelSec)}
        </span>
      ) : null}
    </div>
  );
}

