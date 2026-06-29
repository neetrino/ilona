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

export function useVoiceMessagePlayer({ fileUrl, duration: durationProp }: VoiceMessagePlayerProps) {
  const { user } = useAuthStore();
  const ui = getChatThemeForRole(user?.role);
  const userId = user?.id ?? null;

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
    setPlaybackSpeed(getStoredPlaybackSpeed(userId));
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
    }
  }, [proxiedUrl]);

  const seekToRatio = (ratio: number) => {
    const el = audioRef.current;
    if (!el || isLoading) return;
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
    if (currentAudio) {
      pauseOtherAudio(currentAudio);
      setActiveAudioElement(currentAudio);
    }
    setIsPlaying(true);
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
    }
    setIsPlaying(false);
    const dur = getEffectiveDuration(el, durationProp);
    if (dur > 0) {
      setProgress(100);
      setCurrentTimeSec(dur);
    }
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
    if (!el) return;
    pauseOtherAudio(el);
    const dur = getEffectiveDuration(el, durationProp);
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
