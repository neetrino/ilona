'use client';

import { useTranslations } from 'next-intl';
import { formatVoiceDuration } from './voice-message-player.util';

interface VoiceMessagePlayerErrorStateProps {
  durationProp?: number;
  onRetry: () => void;
}

export function VoiceMessagePlayerErrorState({
  durationProp,
  onRetry,
}: VoiceMessagePlayerErrorStateProps) {
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');

  return (
    <div className="flex items-center gap-3 min-w-[200px] p-2 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex-shrink-0 text-red-500">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-xs text-red-700 font-medium">{tChat('unableToPlayAudio')}</p>
        <p className="text-xs text-red-600">{tChat('fileMissingOrInaccessible')}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        title={tChat('retryLoadingAudio')}
      >
        {tCommon('retry')}
      </button>
      {durationProp != null ? (
        <span className="text-xs text-red-600 flex-shrink-0">
          {formatVoiceDuration(durationProp)}
        </span>
      ) : null}
    </div>
  );
}
