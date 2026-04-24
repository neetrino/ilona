'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getRecordingPlayUrl } from '@/features/crm/api/crm.api';
import { cn } from '@/shared/lib/utils';
import { useCrmExclusiveAudio } from './CrmExclusiveAudioContext';

type LeadCardVoiceInlineProps = {
  r2Key: string;
  mimeType: string | null;
  className?: string;
};

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LeadCardVoiceInline({
  r2Key,
  className,
}: LeadCardVoiceInlineProps) {
  const src = useMemo(() => getRecordingPlayUrl(r2Key), [r2Key]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const { takeOverPlayback } = useCrmExclusiveAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    setCurrentSec(0);
    setMuted(false);
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentSec(0);
    };
    const onTimeUpdate = () => {
      const d = el.duration;
      setCurrentSec(el.currentTime);
      if (d > 0 && !Number.isNaN(d)) {
        setProgress(el.currentTime / d);
      }
    };
    const onVolumeChange = () => setMuted(el.muted);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('volumechange', onVolumeChange);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('volumechange', onVolumeChange);
    };
  }, [src]);

  const toggle = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const el = audioRef.current;
      if (!el) return;
      if (isPlaying) {
        el.pause();
        return;
      }
      takeOverPlayback(el);
      try {
        await el.play();
      } catch {
        // Playback blocked or failed.
      }
    },
    [isPlaying, takeOverPlayback]
  );

  const toggleMute = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  const seekFromPointer = useCallback((clientX: number) => {
    const el = audioRef.current;
    const bar = trackRef.current;
    if (!el || !bar) return;
    const d = el.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    el.currentTime = ratio * d;
    setCurrentSec(el.currentTime);
    setProgress(ratio);
  }, []);

  const onTrackClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      seekFromPointer(e.clientX);
    },
    [seekFromPointer]
  );

  return (
    <div
      className={cn('min-w-0', className)}
      role="group"
      aria-label="Voice note playback"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Voice
      </p>
      <div className="flex min-w-0 items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2">
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'shrink-0 rounded-md p-0.5 text-slate-900 transition-opacity hover:opacity-70',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1'
          )}
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? (
            <svg
              viewBox="0 0 14 16"
              className="h-3.5 w-3.5"
              fill="currentColor"
              aria-hidden
            >
              <rect x="1" y="1" width="4" height="14" rx="0.5" />
              <rect x="9" y="1" width="4" height="14" rx="0.5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 14 16"
              className="h-3.5 w-3.5"
              fill="currentColor"
              aria-hidden
            >
              <polygon points="0,0 14,8 0,16" />
            </svg>
          )}
        </button>
        <span className="shrink-0 text-xs font-medium tabular-nums text-slate-900">
          {formatTime(currentSec)}
        </span>
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Playback position"
          className="relative h-0.5 min-w-0 flex-1 cursor-pointer rounded-full bg-slate-300"
          onClick={onTrackClick}
          onKeyDown={(e) => {
            e.stopPropagation();
            const el = audioRef.current;
            const d = el?.duration;
            if (!el || !Number.isFinite(d) || d <= 0) return;
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              el.currentTime = Math.max(0, el.currentTime - 5);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              el.currentTime = Math.min(d, el.currentTime + 5);
            }
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-slate-600"
            style={{ width: `${Math.round(progress * 1000) / 10}%` }}
          />
        </div>
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            'shrink-0 rounded-md p-0.5 text-slate-900 transition-opacity hover:opacity-70',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1'
          )}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <Volume2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
