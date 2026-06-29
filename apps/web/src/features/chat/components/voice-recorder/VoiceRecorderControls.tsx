'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import type { VoiceRecorderViewModel } from './voice-recorder.types';

interface VoiceRecorderControlsProps {
  vm: VoiceRecorderViewModel;
  variant?: 'default' | 'student';
  buttonRadius?: 'default' | '15px';
}

export function VoiceRecorderControls({
  vm,
  variant = 'default',
  buttonRadius = 'default',
}: VoiceRecorderControlsProps) {
  const actionRadiusClass = buttonRadius === '15px' ? 'rounded-[15px]' : 'rounded-lg';
  const recordRadiusClass = buttonRadius === '15px' ? 'rounded-[15px]' : 'rounded-full';
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const {
    ui,
    isRecording,
    durationSec,
    previewUrl,
    recordedBlob,
    error,
    canSend,
    isSending,
    micLevel,
    micWarning,
    startRecording,
    stopRecording,
    handleSend,
    onCancel,
    formatDuration,
    setError,
  } = vm;

  return (
    <div className={cn('border-t bg-white p-4', ui.border)}>
      <div className="flex items-center gap-3">
        {!isRecording && !recordedBlob && (
          <button
            onClick={() => void startRecording()}
            className={cn(
              'flex-shrink-0 p-3 bg-red-600 text-white transition-colors hover:bg-red-700',
              recordRadiusClass,
            )}
            title={tChat('startRecording')}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={stopRecording}
              className={cn(
                'flex-shrink-0 p-3 text-white transition-colors',
                recordRadiusClass,
                variant === 'student' ? 'bg-[#3b3b40] hover:bg-[#1010a3]' : 'bg-slate-600 hover:bg-slate-700',
              )}
              title={tChat('stopRecording')}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className={cn('text-sm font-medium', ui.body)}>
                  {tChat('recording', { duration: formatDuration(durationSec) })}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn('text-xs', ui.muted)}>{tChat('micLevel')}</span>
                <div className={cn('h-2 flex-1 overflow-hidden rounded-full', ui.skeleton)}>
                  <div
                    className={cn(
                      'h-full transition-all duration-100',
                      micLevel > 10 ? 'bg-green-500' : micLevel > 5 ? 'bg-yellow-500' : 'bg-red-500',
                    )}
                    style={{ width: `${Math.min(100, micLevel)}%` }}
                  />
                </div>
                <span className={cn('w-8 text-right text-xs', ui.muted)}>{micLevel}%</span>
              </div>
            </div>
          </>
        )}

        {recordedBlob && !isRecording && (
          <>
            <div className="flex-1 flex items-center gap-3">
              {previewUrl && (
                <audio
                  src={previewUrl}
                  controls
                  preload="metadata"
                  className="flex-1 h-10"
                  style={{ minWidth: '200px' }}
                  onError={() => setError(tChat('previewPlaybackFailed'))}
                />
              )}
              <span className={cn('text-sm', ui.body)}>{formatDuration(durationSec)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                disabled={isSending}
                className={cn(
                  'px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  actionRadiusClass,
                  ui.ghostBtn,
                )}
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={() => void handleSend()}
                disabled={!canSend || isSending}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-all',
                  actionRadiusClass,
                  isSending && 'cursor-wait opacity-90',
                  canSend && !isSending ? ui.primaryBtn : ui.primaryBtnDisabled,
                )}
              >
                {isSending ? tChat('sending') : tChat('send')}
              </button>
            </div>
          </>
        )}
      </div>

      {micWarning && (
        <div className={cn('mt-2 bg-yellow-50 px-3 py-2 text-sm text-yellow-700', actionRadiusClass)}>
          {micWarning}
        </div>
      )}

      {error && (
        <div className={cn('mt-2 bg-red-50 px-3 py-2 text-sm text-red-600', actionRadiusClass)}>{error}</div>
      )}
    </div>
  );
}
