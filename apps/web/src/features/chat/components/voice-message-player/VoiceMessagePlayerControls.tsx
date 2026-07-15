'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { formatSpeedLabel } from './voice-message-player.util';
import type { useVoiceMessagePlayer } from './useVoiceMessagePlayer';

type VoiceMessagePlayerControlsProps = {
  vm: ReturnType<typeof useVoiceMessagePlayer>;
};

export function VoiceMessagePlayerControls({ vm }: VoiceMessagePlayerControlsProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={vm.isPlaying ? vm.handlePauseClick : vm.handlePlayClick}
            disabled={vm.hasError}
            className={cn(
              'flex h-10 w-10 flex-shrink-0 touch-manipulation items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50',
              vm.ui.voicePlayCircle,
            )}
            title={vm.isPlaying ? tCommon('pause') : tCommon('play')}
            aria-label={vm.isPlaying ? tCommon('pause') : tCommon('play')}
          >
            {vm.isPlaying ? (
              <svg className={cn('h-5 w-5', vm.ui.voicePlayIcon)} fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg
                className={cn('ml-0.5 h-5 w-5', vm.ui.voicePlayIcon)}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div
              ref={vm.progressTrackRef}
              role="slider"
              tabIndex={0}
              aria-valuenow={Math.round(vm.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={tChat('playbackPosition')}
              className="relative py-2 -my-1 cursor-pointer touch-manipulation group"
              onPointerDown={vm.handleProgressPointerDown}
              onPointerMove={vm.handleProgressPointerMove}
              onPointerUp={vm.handleProgressPointerUp}
              onPointerCancel={vm.handleProgressPointerCancel}
              onKeyDown={vm.handleProgressKeyDown}
            >
              <div className={cn('pointer-events-none h-2 overflow-hidden rounded-full', vm.ui.skeleton)}>
                <div
                  className={cn(
                    'h-full rounded-full group-focus-within:ring-2',
                    vm.ui.avatar,
                    vm.userRole === 'STUDENT'
                      ? 'group-focus-within:ring-[#1010a3]/30'
                      : 'group-focus-within:ring-primary/40',
                    !vm.isScrubbing && 'transition-[width] duration-75 ease-linear',
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, vm.progress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {vm.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded pointer-events-none">
            <div className={cn('h-4 w-4 animate-spin rounded-full', vm.ui.spinner)} />
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={vm.cyclePlaybackSpeed}
        className="flex-shrink-0 min-w-[2.75rem] py-1.5 px-2.5 text-sm font-semibold rounded-lg bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-colors touch-manipulation"
        title={`Playback speed: ${formatSpeedLabel(vm.playbackSpeed)}. Click to change.`}
        aria-label={`Playback speed ${formatSpeedLabel(vm.playbackSpeed)}`}
      >
        {formatSpeedLabel(vm.playbackSpeed)}
      </button>
      {vm.totalLabelSec > 0 ? (
        <span
          className={cn(
            'flex-shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums',
            vm.ui.muted,
          )}
        >
          {vm.formatVoiceDuration(vm.currentTimeSec)} / {vm.formatVoiceDuration(vm.totalLabelSec)}
        </span>
      ) : null}
    </div>
  );
}
