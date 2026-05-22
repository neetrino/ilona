'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { Mic, Pause, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getRecordingPlayUrl } from '@/features/crm/api/crm.api';
import { cn } from '@/shared/lib/utils';
import { useCrmExclusiveAudio } from './CrmExclusiveAudioContext';

type LeadCardVoiceInlineProps = {
  r2Key: string;
  mimeType: string | null;
  className?: string;
  showLabel?: boolean;
};

const PLAYBACK_SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
type PlaybackSpeed = (typeof PLAYBACK_SPEED_OPTIONS)[number];

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
  mimeType: _mimeType,
  className,
  showLabel = false,
}: LeadCardVoiceInlineProps) {
  const t = useTranslations('crm');
  const src = useMemo(() => getRecordingPlayUrl(r2Key), [r2Key]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const { takeOverPlayback } = useCrmExclusiveAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    setCurrentSec(0);
    setDurationSec(0);
    setPlaybackSpeed(1);
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
    const onLoadedMetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDurationSec(el.duration);
      }
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

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

  const cyclePlaybackSpeed = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setPlaybackSpeed((prev) => {
      const currentIdx = PLAYBACK_SPEED_OPTIONS.indexOf(prev);
      const nextIdx = (currentIdx + 1) % PLAYBACK_SPEED_OPTIONS.length;
      return PLAYBACK_SPEED_OPTIONS[nextIdx];
    });
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
      aria-label={t('voiceNotePlayback')}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {showLabel ? (
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {t('voiceSection')}
        </p>
      ) : null}
      <div className="flex min-w-0 items-center gap-1.5 rounded-[0.875rem] bg-[#2329b8] px-2 py-1.5 text-white sm:gap-2">
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
        <span className="shrink-0 text-white/85" aria-hidden>
          <Mic className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'group shrink-0 rounded-full border border-white/70 bg-gradient-to-b from-white to-indigo-50 p-2 text-[#1f2797] shadow-[0_6px_16px_rgba(10,14,110,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:from-white hover:to-indigo-100 hover:shadow-[0_10px_20px_rgba(10,14,110,0.42)] active:translate-y-0',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#2329b8]',
          )}
          aria-label={isPlaying ? t('pauseVoiceNote') : t('playVoiceNote')}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-current" strokeWidth={2.5} aria-hidden />
          ) : (
            <Play className="h-4 w-4 fill-current pl-[1px]" strokeWidth={2.3} aria-hidden />
          )}
        </button>
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={t('playbackPosition')}
          className="relative h-1 min-w-0 flex-1 cursor-pointer rounded-full bg-white/25"
          onClick={onTrackClick}
          onKeyDown={(e) => {
            e.stopPropagation();
            const el = audioRef.current;
            const d = el?.duration;
            if (!el || typeof d !== 'number' || !Number.isFinite(d) || d <= 0) return;
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
            className="absolute inset-y-0 left-0 rounded-full bg-[#d4d8e2]"
            style={{ width: `${Math.round(progress * 1000) / 10}%` }}
          />
        </div>
        <button
          type="button"
          onClick={cyclePlaybackSpeed}
          className={cn(
            'shrink-0 rounded-lg bg-[#f7edc6] px-2 py-0.5 text-xs font-semibold text-[#7a4724] transition-colors hover:bg-[#f3e3ab]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#2329b8]',
          )}
          aria-label="Playback speed"
        >
          {playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}
        </button>
        <span className="shrink-0 text-sm leading-none text-white/40" aria-hidden>
          ·
        </span>
        <span className="shrink-0 whitespace-nowrap text-xs font-medium tabular-nums text-white">
          {formatTime(currentSec)} / {formatTime(durationSec || 0)}
        </span>
      </div>
    </div>
  );
}
