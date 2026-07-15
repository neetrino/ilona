'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { VOICE_BUBBLE_CLASS, WAVEFORM_BAR_COUNT } from './voice-message-player.constants';
import { formatSpeedLabel, generateWaveformLevels } from './voice-message-player.util';
import type { useVoiceMessagePlayer } from './useVoiceMessagePlayer';

type VoiceMessagePlayerControlsProps = {
  vm: ReturnType<typeof useVoiceMessagePlayer>;
};

export function VoiceMessagePlayerControls({ vm }: VoiceMessagePlayerControlsProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');

  const waveformLevels = useMemo(
    () => generateWaveformLevels(vm.proxiedUrl, WAVEFORM_BAR_COUNT),
    [vm.proxiedUrl],
  );

  const showSpeedControl = vm.isPlaying || vm.currentTimeSec > 0.05;
  const timeLabelSec = showSpeedControl
    ? vm.currentTimeSec
    : vm.totalLabelSec > 0
      ? vm.totalLabelSec
      : 0;

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
          VOICE_BUBBLE_CLASS,
        )}
      >
        <button
          type="button"
          onClick={vm.isPlaying ? vm.handlePauseClick : vm.handlePlayClick}
          disabled={vm.hasError}
          className="relative z-[1] flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
                  'min-w-0 flex-1 self-center rounded-full bg-white',
                  isPlayed ? 'opacity-100' : 'opacity-45',
                  !vm.isScrubbing && 'transition-opacity duration-75',
                )}
                style={{ height: `${Math.round(level * 100)}%`, maxWidth: '4px' }}
              />
            );
          })}
        </div>

        <div className="flex w-[3.25rem] shrink-0 flex-col items-end justify-center gap-1.5">
          <span className="whitespace-nowrap text-sm font-medium tabular-nums leading-none text-white">
            {vm.formatVoiceDuration(timeLabelSec)}
          </span>
          {showSpeedControl ? (
            <button
              type="button"
              onClick={vm.cyclePlaybackSpeed}
              className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold tabular-nums leading-none text-white backdrop-blur-[1px] transition-colors hover:bg-white/35"
              title={`Playback speed: ${formatSpeedLabel(vm.playbackSpeed)}. Click to change.`}
              aria-label={`Playback speed ${formatSpeedLabel(vm.playbackSpeed)}`}
            >
              {formatSpeedLabel(vm.playbackSpeed)}
            </button>
          ) : null}
        </div>

        {vm.isLoading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-[#1010a3]/55">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
