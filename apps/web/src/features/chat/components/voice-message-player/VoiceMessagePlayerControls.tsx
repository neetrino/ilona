'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import {
  VOICE_BUBBLE_CLASS,
  VOICE_BUBBLE_TO_TEACHER_CLASS,
  WAVEFORM_BAR_COUNT,
} from './voice-message-player.constants';
import { formatSpeedLabel, generateWaveformLevels } from './voice-message-player.util';
import type { useVoiceMessagePlayer } from './useVoiceMessagePlayer';
import type { VoiceMessagePlayerVariant } from './voice-message-player.types';

type VoiceMessagePlayerControlsProps = {
  vm: ReturnType<typeof useVoiceMessagePlayer>;
  variant?: VoiceMessagePlayerVariant;
};

export function VoiceMessagePlayerControls({
  vm,
  variant = 'default',
}: VoiceMessagePlayerControlsProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');

  const waveformLevels = useMemo(
    () => generateWaveformLevels(vm.proxiedUrl, WAVEFORM_BAR_COUNT),
    [vm.proxiedUrl],
  );

  const showSpeedControl = vm.isPlaying || vm.currentTimeSec > 0.05;
  const timeLabelSec =
    vm.totalLabelSec > 0
      ? showSpeedControl
        ? Math.max(0, vm.totalLabelSec - vm.currentTimeSec)
        : vm.totalLabelSec
      : 0;

  const isToTeacher = variant === 'toTeacher';
  const bubbleClass = isToTeacher ? VOICE_BUBBLE_TO_TEACHER_CLASS : VOICE_BUBBLE_CLASS;
  const accentClass = isToTeacher ? 'text-amber-800' : 'text-white';
  const waveClass = isToTeacher ? 'bg-amber-800' : 'bg-white';
  const speedBtnClass = isToTeacher
    ? 'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold tabular-nums leading-none text-amber-800 transition-colors hover:bg-amber-200'
    : 'rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold tabular-nums leading-none text-white backdrop-blur-[1px] transition-colors hover:bg-white/35';
  const loadingOverlayClass = isToTeacher ? 'bg-amber-100/70' : 'bg-[#1010a3]/55';
  const spinnerClass = isToTeacher
    ? 'border-2 border-amber-800 border-t-transparent'
    : 'border-2 border-white border-t-transparent';

  return (
    <div className="relative w-full min-w-[260px] max-w-[360px]">
      <audio
        ref={vm.audioRef}
        src={vm.proxiedUrl}
        preload="metadata"
        playsInline
        className="sr-only"
        onError={vm.handleError}
        onCanPlay={vm.handleCanPlay}
        onLoadedData={vm.handleCanPlay}
        onLoadStart={vm.handleLoadStart}
        onPlay={vm.handlePlay}
        onPause={vm.handlePause}
        onEnded={vm.handleEnded}
        onTimeUpdate={vm.handleTimeUpdate}
        onLoadedMetadata={vm.handleLoadedMetadata}
      />

      <div
        className={cn(
          'relative flex min-h-[4rem] min-w-0 items-center gap-3.5 overflow-hidden rounded-full px-5 py-3',
          bubbleClass,
        )}
      >
        <button
          type="button"
          onClick={vm.isPlaying ? vm.handlePauseClick : vm.handlePlayClick}
          disabled={vm.hasError}
          className={cn(
            'relative z-[1] flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50',
            accentClass,
          )}
          title={vm.isPlaying ? tCommon('pause') : tCommon('play')}
          aria-label={vm.isPlaying ? tCommon('pause') : tCommon('play')}
        >
          {vm.isPlaying ? (
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div
          ref={vm.progressTrackRef}
          role="slider"
          tabIndex={0}
          aria-valuenow={Math.round(vm.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={tChat('playbackPosition')}
          className="flex h-10 min-w-0 flex-1 cursor-pointer touch-manipulation items-center gap-px overflow-hidden"
          onPointerDown={vm.handleProgressPointerDown}
          onPointerMove={vm.handleProgressPointerMove}
          onPointerUp={vm.handleProgressPointerUp}
          onPointerCancel={vm.handleProgressPointerCancel}
          onKeyDown={vm.handleProgressKeyDown}
        >
          {waveformLevels.map((level, index) => {
            const barProgress = ((index + 0.5) / waveformLevels.length) * 100;
            const isPlayed = barProgress <= vm.progress;
            return (
              <span
                key={index}
                className={cn(
                  'min-w-0 flex-1 self-center rounded-full',
                  waveClass,
                  isPlayed ? 'opacity-100' : 'opacity-40',
                  !vm.isScrubbing && 'transition-opacity duration-75',
                )}
                style={{ height: `${Math.round(level * 100)}%`, maxWidth: '4px' }}
              />
            );
          })}
        </div>

        <div className="flex w-[3.25rem] shrink-0 flex-col items-end justify-center gap-1.5">
          <span
            className={cn(
              'whitespace-nowrap text-sm font-medium tabular-nums leading-none',
              accentClass,
            )}
          >
            {vm.formatVoiceDuration(timeLabelSec)}
          </span>
          {showSpeedControl ? (
            <button
              type="button"
              onClick={vm.cyclePlaybackSpeed}
              className={speedBtnClass}
              title={`Playback speed: ${formatSpeedLabel(vm.playbackSpeed)}. Click to change.`}
              aria-label={`Playback speed ${formatSpeedLabel(vm.playbackSpeed)}`}
            >
              {formatSpeedLabel(vm.playbackSpeed)}
            </button>
          ) : null}
        </div>

        {vm.isLoading ? (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center rounded-full',
              loadingOverlayClass,
            )}
          >
            <div className={cn('h-5 w-5 animate-spin rounded-full', spinnerClass)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
