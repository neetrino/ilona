import type { ParticipationOption } from '@/shared/components/daily-duties/lesson-feedback-form-utils';

export type StudentFeedbackParticipationKey =
  | 'quietObserver'
  | 'joiningTheFlow'
  | 'steadyPresence'
  | 'activeParticipant'
  | 'brilliantParticipant';

const PARTICIPATION_KEY_BY_LABEL: Record<ParticipationOption, StudentFeedbackParticipationKey> = {
  'Quiet Observer': 'quietObserver',
  'Joining the Flow': 'joiningTheFlow',
  'Steady Presence': 'steadyPresence',
  'Active Participant': 'activeParticipant',
  'Brilliant Participant': 'brilliantParticipant',
};

export function participationKeyFromLabel(
  label: ParticipationOption | null,
): StudentFeedbackParticipationKey | null {
  if (!label) return null;
  return PARTICIPATION_KEY_BY_LABEL[label] ?? null;
}

/** Prefer a short first line as a topic badge when progress has a body. */
export function splitProgressTopic(progress: string): {
  topic: string | null;
  body: string;
} {
  const trimmed = progress.trim();
  if (!trimmed) {
    return { topic: null, body: '' };
  }

  const parts = trimmed
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0];
    const looksLikeTopic =
      first.length <= 48 &&
      !first.includes('. ') &&
      !first.endsWith('.') &&
      first.split(' ').length <= 6;

    if (looksLikeTopic) {
      return {
        topic: first,
        body: parts.slice(1).join('\n\n'),
      };
    }
  }

  return { topic: null, body: trimmed };
}

export function buildTargetChipLabels(input: {
  level: string;
  grammar: string[];
  speaking: boolean;
  writing: boolean;
  speakingLabel: string;
  writingLabel: string;
}): string[] {
  const chips: string[] = [];
  if (input.level.trim()) {
    chips.push(input.level.trim());
  }
  for (const topic of input.grammar) {
    const value = topic.trim();
    if (value) chips.push(value);
  }
  if (input.speaking) chips.push(input.speakingLabel);
  if (input.writing) chips.push(input.writingLabel);
  return chips;
}
