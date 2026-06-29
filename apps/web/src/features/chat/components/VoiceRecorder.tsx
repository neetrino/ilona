'use client';

import { useVoiceRecorder } from './voice-recorder/useVoiceRecorder';
import { VoiceRecorderControls } from './voice-recorder/VoiceRecorderControls';
import type { VoiceRecorderProps } from './voice-recorder/voice-recorder.types';

export type { VoiceRecorderProps } from './voice-recorder/voice-recorder.types';

export function VoiceRecorder(props: VoiceRecorderProps) {
  const vm = useVoiceRecorder(props);
  return (
    <VoiceRecorderControls
      vm={vm}
      variant={props.variant}
      buttonRadius={props.buttonRadius}
    />
  );
}
