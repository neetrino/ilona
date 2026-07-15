'use client';

import { useState, useRef, useEffect } from 'react';
import { getProxiedFileUrl } from '@/shared/lib/api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getChatThemeForRole } from '../../lib/chat-theme';
import { PLAYBACK_SPEED_OPTIONS } from './voice-message-player.constants';
import type { PlaybackSpeed, VoiceMessagePlayerProps } from './voice-message-player.types';
import {
  clearActiveAudioIfMatch,
  formatVoiceDuration,
  getAudioErrorMessage,
  getEffectiveDuration,
  getStoredPlaybackSpeed,
  pauseOtherAudio,
  persistPlaybackSpeed,
  setActiveAudioElement,
} from './voice-message-player.util';

export function useVoiceMessagePlayer({
  fileUrl,
  duration: durationProp,
  onEnded,
}: VoiceMessagePlayerProps) {
  const { user } = useAuthStore();
  const ui = getChatThemeForRole(user?.role);
  const userId = user?.id ?? null;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [mediaDurationSec, setMediaDurationSec] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const proxiedUrl = getProxiedFileUrl(fileUrl) || fileUrl;

  useEffect(() => {
    const stored = getStoredPlaybackSpeed(userId);
    setPlaybackSpeed(
      (PLAYBACK_SPEED_OPTIONS as readonly number[]).includes(stored) ? stored : 1,
    );
  }, [userId]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (audioEl) {
        clearActiveAudioIfMatch(audioEl);
      }
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (el && proxiedUrl) {
      el.currentTime = 0;
      setProgress(0);
      setCurrentTimeSec(0);
      setMediaDurationSec(0);
      setHasError(false);
      setIsLoading(true);
      setIsPlaying(false);
    }
  }, [proxiedUrl]);

  // iOS Safari often never fires `canplay` with preload=metadata until play().
  // Do not leave the UI stuck waiting forever.
  useEffect(() => {
    if (!isLoading || !proxiedUrl) return;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading, proxiedUrl]);

  const seekToRatio = (ratio: number) => {
    const el = audioRef.current;
    if (!el || hasError) return;
    const dur = getEffectiveDuration(el, durationProp);
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
    seekToRatio((clientX - rect.left) / rect.width);
  };

  const playFromCurrentPosition = () => {
    const el = audioRef.current;
    if (!el || hasError) return;
    pauseOtherAudio(el);
    setActiveAudioElement(el);
    void el
      .play()
      .then(() => {
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
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
    if (hasError) return;
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
    seekFromClientX(e.clientX);
    endScrubbing(e.currentTarget, e.pointerId);
    // Click / scrub on the wave starts (or resumes) playback from that spot.
    playFromCurrentPosition();
  };

  const handleProgressPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    endScrubbing(e.currentTarget, e.pointerId);
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (hasError) return;
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
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playFromCurrentPosition();
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audio = e.currentTarget;
    const error = audio.error;
    if (error) {
      console.warn('[ChatWindow] Voice playback error:', {
        code: error.code,
        message: getAudioErrorMessage(error),
        fileUrl: proxiedUrl.substring(0, 100),
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

  const markReady = () => {
    setIsLoading(false);
    setHasError(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
    syncDurationFromElement();
  };

  const handleCanPlay = () => {
    markReady();
  };

  const handleLoadedMetadata = () => {
    markReady();
  };

  const handlePlay = () => {
    const currentAudio = audioRef.current;
    if (currentAudio) {
      pauseOtherAudio(currentAudio);
      setActiveAudioElement(currentAudio);
    }
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handlePause = () => {
    const el = audioRef.current;
    if (el) {
      clearActiveAudioIfMatch(el);
    }
    setIsPlaying(false);
  };

  const handleEnded = () => {
    const el = audioRef.current;
    if (el) {
      clearActiveAudioIfMatch(el);
      el.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTimeSec(0);
    onEndedRef.current?.();
  };

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

  const handlePlayClick = () => {
    const el = audioRef.current;
    if (!el || hasError) return;
    pauseOtherAudio(el);
    setActiveAudioElement(el);
    const dur = getEffectiveDuration(el, durationProp);
    if (dur > 0 && el.currentTime >= dur - 0.15) {
      el.currentTime = 0;
      setProgress(0);
      setCurrentTimeSec(0);
    }
    // iOS requires a user gesture to start decode/playback; never block play on loading.
    void el.play().then(() => {
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  };

  const handlePauseClick = () => {
    audioRef.current?.pause();
  };

  const handleLoadStart = () => {
    const el = audioRef.current;
    // iOS can re-fire loadstart on seek/buffer; keep controls usable once metadata exists.
    if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      return;
    }
    setIsLoading(true);
    setHasError(false);
  };

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
    const next = PLAYBACK_SPEED_OPTIONS[(idx < 0 ? 0 : idx + 1) % PLAYBACK_SPEED_OPTIONS.length];
    setPlaybackSpeed(next);
    persistPlaybackSpeed(userId, next);
  };

  const totalLabelSec =
    durationProp != null && durationProp > 0 ? durationProp : mediaDurationSec;

  return {
    ui,
    userRole: user?.role,
    proxiedUrl,
    hasError,
    isLoading,
    playbackSpeed,
    isPlaying,
    progress,
    currentTimeSec,
    totalLabelSec,
    isScrubbing,
    durationProp,
    audioRef,
    progressTrackRef,
    handleError,
    handleCanPlay,
    handleLoadedMetadata,
    handleLoadStart,
    handlePlay,
    handlePause,
    handleEnded,
    handleTimeUpdate,
    syncDurationFromElement,
    handlePlayClick,
    handlePauseClick,
    handleRetry,
    cyclePlaybackSpeed,
    handleProgressPointerDown,
    handleProgressPointerMove,
    handleProgressPointerUp,
    handleProgressPointerCancel,
    handleProgressKeyDown,
    formatVoiceDuration,
  };
}
