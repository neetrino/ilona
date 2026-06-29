import type { Message } from '../../types';

export function isVocabularyMessage(message: Message): boolean {
  return Boolean(
    message.metadata &&
      typeof message.metadata === 'object' &&
      'isVocabulary' in message.metadata,
  );
}

export function getSubstituteVoiceLabel(message: Message, defaultLabel: string): string | null {
  const voiceSubstituteMeta =
    message.type === 'VOICE' &&
    message.metadata &&
    typeof message.metadata === 'object' &&
    'sentAsSubstitute' in message.metadata &&
    message.metadata.sentAsSubstitute === true;

  if (!voiceSubstituteMeta) return null;

  if (
    typeof message.metadata === 'object' &&
    message.metadata !== null &&
    'substituteLabel' in message.metadata &&
    typeof (message.metadata as { substituteLabel?: unknown }).substituteLabel === 'string'
  ) {
    return (message.metadata as { substituteLabel: string }).substituteLabel;
  }

  return defaultLabel;
}
