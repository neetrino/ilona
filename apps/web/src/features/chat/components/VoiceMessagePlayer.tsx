'use client';

import { useVoiceMessagePlayer } from './voice-message-player/useVoiceMessagePlayer';
import { VoiceMessagePlayerErrorState } from './voice-message-player/VoiceMessagePlayerErrorState';
import { VoiceMessagePlayerControls } from './voice-message-player/VoiceMessagePlayerControls';
import type { VoiceMessagePlayerProps } from './voice-message-player/voice-message-player.types';

export type { VoiceMessagePlayerProps } from './voice-message-player/voice-message-player.types';

export function VoiceMessagePlayer(props: VoiceMessagePlayerProps) {
  const vm = useVoiceMessagePlayer(props);

  if (vm.hasError) {
    return (
      <VoiceMessagePlayerErrorState durationProp={vm.durationProp} onRetry={vm.handleRetry} />
    );
  }

  return <VoiceMessagePlayerControls vm={vm} />;
}
