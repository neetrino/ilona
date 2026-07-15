'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useVoiceMessagePlayer } from './voice-message-player/useVoiceMessagePlayer';
import { VoiceMessagePlayerErrorState } from './voice-message-player/VoiceMessagePlayerErrorState';
import { VoiceMessagePlayerControls } from './voice-message-player/VoiceMessagePlayerControls';
import type {
  VoiceMessagePlayerHandle,
  VoiceMessagePlayerProps,
} from './voice-message-player/voice-message-player.types';

export type {
  VoiceMessagePlayerHandle,
  VoiceMessagePlayerProps,
} from './voice-message-player/voice-message-player.types';

export const VoiceMessagePlayer = forwardRef<VoiceMessagePlayerHandle, VoiceMessagePlayerProps>(
  function VoiceMessagePlayer(props, ref) {
    const vm = useVoiceMessagePlayer(props);
    const playRef = useRef(vm.handlePlayClick);
    playRef.current = vm.handlePlayClick;

    useImperativeHandle(ref, () => ({
      play: () => {
        playRef.current();
      },
    }));

    if (vm.hasError) {
      return (
        <VoiceMessagePlayerErrorState durationProp={vm.durationProp} onRetry={vm.handleRetry} />
      );
    }

    return <VoiceMessagePlayerControls vm={vm} variant={props.variant ?? 'default'} />;
  },
);
