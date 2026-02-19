'use client';

import { useState, useRef } from 'react';
import { getProxiedFileUrl } from '@/shared/lib/api';

interface VoiceMessagePlayerProps {
  fileUrl: string;
  duration?: number;
  fileName?: string;
}

export function VoiceMessagePlayer({
  fileUrl,
  duration,
  fileName: _fileName,
}: VoiceMessagePlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Convert R2 URLs to API proxy URLs to avoid CORS issues
  const proxiedUrl = getProxiedFileUrl(fileUrl) || fileUrl;

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

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
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
      audioRef.current.load();
    }
  };

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
        {duration && (
          <span className="text-xs text-red-600 flex-shrink-0">
            {formatDuration(duration)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <div className="flex-shrink-0">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </div>
      <div className="flex-1 relative">
        <audio
          ref={audioRef}
          src={proxiedUrl}
          controls
          preload="metadata"
          className="flex-1 h-10 w-full"
          style={{ minWidth: '200px' }}
          onError={handleError}
          onCanPlay={handleCanPlay}
          onLoadStart={handleLoadStart}
          crossOrigin="anonymous"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {duration && (
        <span className="text-xs opacity-80 flex-shrink-0">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}

