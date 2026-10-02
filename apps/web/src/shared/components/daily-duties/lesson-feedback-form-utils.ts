export const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const GRAMMAR_OPTIONS = [
  'Tenses',
  'Articles',
  'Prepositions',
  'Conditionals',
  'Modal verbs',
] as const;

export const PARTICIPATION_OPTIONS = [
  'Quiet Observer',
  'Joining the Flow',
  'Brilliant Participant',
  'Steady Presence',
  'Active Participant',
] as const;

export type ParticipationOption = (typeof PARTICIPATION_OPTIONS)[number];

export type {
  ProgressAreaOption,
} from './progress-feedback-options';
export {
  PROGRESS_AREA_OPTIONS,
  PROGRESS_OTHER_VALUE,
  PROGRESS_TOPICS_BY_AREA,
  progressAreaHasTopicDropdown,
  resolveProgressAreaLabel,
  resolveProgressTopicLabel,
} from './progress-feedback-options';

import type { ProgressAreaOption } from './progress-feedback-options';
import {
  PROGRESS_AREA_OPTIONS,
  resolveProgressAreaLabel,
  resolveProgressTopicLabel,
} from './progress-feedback-options';

export interface StructuredFeedbackFields {
  level: string;
  grammar: string[];
  speaking: boolean;
  writing: boolean;
  skillsComment: string;
  comment: string;
  participation: ParticipationOption | null;
  progressArea: ProgressAreaOption | '';
  progressTopic: string;
  progressAreaCustom: string;
  progressTopicCustom: string;
  /** Free-text progress comment (not the area/topic labels). */
  progress: string;
  encouragement: string;
}

export const DEFAULT_FEEDBACK_LEVEL = 'A1';

export function emptyStructuredFeedback(): StructuredFeedbackFields {
  return {
    level: DEFAULT_FEEDBACK_LEVEL,
    grammar: [],
    speaking: false,
    writing: false,
    skillsComment: '',
    comment: '',
    participation: null,
    progressArea: '',
    progressTopic: '',
    progressAreaCustom: '',
    progressTopicCustom: '',
    progress: '',
    encouragement: '',
  };
}

function parseSkillsLine(line: string): Pick<
  StructuredFeedbackFields,
  'speaking' | 'writing' | 'skillsComment'
> {
  const raw = line.replace(/^Skills:\s*/, '').trim();
  if (!raw || raw === 'none') {
    return { speaking: false, writing: false, skillsComment: '' };
  }
  const commentMatch = raw.match(/\(([^)]*)\)\s*$/);
  const skillsComment = commentMatch ? commentMatch[1].trim() : '';
  const withoutParen = commentMatch ? raw.slice(0, commentMatch.index).trim() : raw;
  const parts = withoutParen.split(',').map((s) => s.trim().toLowerCase());
  return {
    speaking: parts.some((p) => p.includes('speaking')),
    writing: parts.some((p) => p.includes('writing')),
    skillsComment,
  };
}

export function participationFromRating(rating: number): ParticipationOption | null {
  if (rating >= 1 && rating <= PARTICIPATION_OPTIONS.length) {
    return PARTICIPATION_OPTIONS[rating - 1];
  }
  return null;
}

type SavedFeedbackSlice = {
  content?: string;
  rating?: number | null;
  level?: string | null;
  grammarTopics?: string[];
  skills?: string[];
  skillsNote?: string | null;
  participation?: number | null;
  progress?: string | null;
  encouragement?: string | null;
} | null;

/** Merge API structured fields with legacy `content` parsing. */
export function structuredFromSavedFeedback(saved: SavedFeedbackSlice): StructuredFeedbackFields {
  const parsed = parseLessonFeedbackContent(saved?.content ?? undefined, saved?.rating ?? undefined);
  if (!saved) return parsed;
  let speaking = saved.skills?.includes('speaking') ?? parsed.speaking;
  const writing = saved.skills?.includes('writing') ?? parsed.writing;
  const skillsComment = saved.skillsNote ?? parsed.skillsComment;
  if (skillsComment?.trim() && !speaking && !writing) {
    speaking = true;
  }

  let progress = parsed.progress;
  let progressArea = parsed.progressArea;
  let progressTopic = parsed.progressTopic;
  const progressAreaCustom = parsed.progressAreaCustom;
  const progressTopicCustom = parsed.progressTopicCustom;

  // DB `progress` may be "Area · Topic\n\ncomment". Prefer free-text from content when present.
  if (!progress.trim() && saved.progress?.trim()) {
    const legacy = splitLegacyProgressStorage(saved.progress);
    progress = legacy.comment || saved.progress.trim();
    if (!progressArea && legacy.topic && !progressTopic) {
      const parts = legacy.topic.split(' · ').map((part) => part.trim()).filter(Boolean);
      if (parts.length === 2 && PROGRESS_AREA_OPTIONS.includes(parts[0] as ProgressAreaOption)) {
        progressArea = parts[0] as ProgressAreaOption;
        progressTopic = parts[1];
      } else {
        progressTopic = legacy.topic;
      }
    }
  }

  return {
    ...parsed,
    level: (saved.level ?? parsed.level) || DEFAULT_FEEDBACK_LEVEL,
    grammar: saved.grammarTopics?.length ? [...saved.grammarTopics] : parsed.grammar,
    speaking,
    writing,
    skillsComment,
    participation:
      saved.participation != null
        ? participationFromRating(saved.participation) ?? parsed.participation
        : parsed.participation,
    progressArea,
    progressTopic,
    progressAreaCustom,
    progressTopicCustom,
    progress,
    encouragement: saved.encouragement ?? parsed.encouragement,
  };
}

function splitLegacyProgressStorage(progress: string): { topic: string; comment: string } {
  const parts = progress
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const looksLikeTopic =
      first.length <= 48 &&
      !first.includes('. ') &&
      !first.endsWith('.') &&
      first.split(/\s+/).length <= 6;
    if (looksLikeTopic) {
      return { topic: first, comment: parts.slice(1).join('\n\n') };
    }
  }
  // "Grammar · Inversions" badge line from newer saves
  if (parts.length >= 2 && parts[0].includes(' · ')) {
    return { topic: parts[0], comment: parts.slice(1).join('\n\n') };
  }
  return { topic: '', comment: progress.trim() };
}

/**
 * Parse persisted feedback `content` into structured fields (best-effort for legacy formats).
 */
export function parseLessonFeedbackContent(
  content: string | undefined,
  fallbackRating?: number | null
): StructuredFeedbackFields {
  const base = emptyStructuredFeedback();
  if (!content?.trim()) {
    if (fallbackRating != null) {
      base.participation = participationFromRating(fallbackRating);
    }
    return base;
  }

  const lines = content.split('\n');
  const getLine = (prefix: string): string => {
    const line = lines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() : '';
  };

  const level = getLine('Level: ');
  const grammarLine = getLine('Grammar: ');
  const grammar = grammarLine
    ? grammarLine.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const skillsLine = lines.find((l) => l.startsWith('Skills: ')) ?? '';
  const skills = parseSkillsLine(skillsLine);

  let comment = getLine('Comment: ');
  if (comment === '-') comment = '';

  let progress = getLine('Progress: ');
  if (progress === '-') progress = '';

  let encouragement = getLine('Encouragement: ');
  if (encouragement === '-') encouragement = '';

  const progressAreaRaw = getLine('ProgressArea: ');
  const progressTopicRaw = getLine('ProgressTopic: ');
  const progressAreaCustom = getLine('ProgressAreaCustom: ');
  const progressTopicCustom = getLine('ProgressTopicCustom: ');

  let progressArea: ProgressAreaOption | '' = '';
  if (PROGRESS_AREA_OPTIONS.includes(progressAreaRaw as ProgressAreaOption)) {
    progressArea = progressAreaRaw as ProgressAreaOption;
  }

  const participationRaw = getLine('Participation: ');
  let participation: ParticipationOption | null = null;
  if (PARTICIPATION_OPTIONS.includes(participationRaw as ParticipationOption)) {
    participation = participationRaw as ParticipationOption;
  } else if (participationRaw && participationRaw !== 'off') {
    const n = Number(participationRaw);
    if (!Number.isNaN(n)) {
      participation = participationFromRating(n);
    }
  }
  if (!participation && fallbackRating != null) {
    participation = participationFromRating(fallbackRating);
  }

  const feedbackIdx = lines.findIndex((l) => l.startsWith('Feedback: '));
  if (feedbackIdx >= 0) {
    const first = lines[feedbackIdx].replace(/^Feedback:\s*/, '');
    const rest = lines.slice(feedbackIdx + 1);
    const body = [first, ...rest].join('\n').trim();
    const expectedNarrative = [comment, progress, encouragement]
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n\n');
    if (body && body !== '—' && body !== expectedNarrative) {
      if (!comment.trim() && !progress.trim() && !encouragement.trim()) {
        comment = body;
      }
    }
  }

  return {
    ...base,
    level: level || DEFAULT_FEEDBACK_LEVEL,
    grammar,
    ...skills,
    comment,
    participation,
    progressArea,
    progressTopic: progressTopicRaw === '-' ? '' : progressTopicRaw,
    progressAreaCustom: progressAreaCustom === '-' ? '' : progressAreaCustom,
    progressTopicCustom: progressTopicCustom === '-' ? '' : progressTopicCustom,
    progress,
    encouragement,
  };
}

export function participationToRating(option: ParticipationOption | null): number | undefined {
  if (!option) return undefined;
  const idx = PARTICIPATION_OPTIONS.indexOf(option);
  return idx >= 0 ? idx + 1 : undefined;
}

/** Progress value stored in DB `progress` column (badges + comment for student view). */
export function buildProgressStorageValue(structured: StructuredFeedbackFields): string | null {
  const areaLabel = resolveProgressAreaLabel(
    structured.progressArea,
    structured.progressAreaCustom,
  );
  const topicLabel = resolveProgressTopicLabel(
    structured.progressTopic,
    structured.progressTopicCustom,
  );
  const badge = [areaLabel, topicLabel].filter(Boolean).join(' · ');
  const comment = structured.progress.trim();
  if (!badge && !comment) return null;
  if (!badge) return comment;
  if (!comment) return badge;
  return `${badge}\n\n${comment}`;
}

export function buildLessonFeedbackContent(structured: StructuredFeedbackFields): string {
  const skillsParts = [
    structured.speaking ? 'speaking' : '',
    structured.writing ? 'writing' : '',
  ].filter(Boolean);
  const skillsLine =
    skillsParts.length > 0
      ? `${skillsParts.join(', ')}${structured.skillsComment ? ` (${structured.skillsComment})` : ''}`
      : 'none';

  const progressStorage = buildProgressStorageValue(structured) ?? '';
  const narrative = [structured.comment, progressStorage, structured.encouragement]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n\n');

  return [
    `Level: ${structured.level}`,
    `Grammar: ${structured.grammar.join(', ')}`,
    `Skills: ${skillsLine}`,
    `Comment: ${structured.comment.trim() || '-'}`,
    `Participation: ${structured.participation ?? 'off'}`,
    `ProgressArea: ${structured.progressArea || '-'}`,
    `ProgressTopic: ${structured.progressTopic.trim() || '-'}`,
    `ProgressAreaCustom: ${structured.progressAreaCustom.trim() || '-'}`,
    `ProgressTopicCustom: ${structured.progressTopicCustom.trim() || '-'}`,
    `Progress: ${structured.progress.trim() || '-'}`,
    `Encouragement: ${structured.encouragement.trim() || '-'}`,
    '',
    `Feedback: ${narrative || '—'}`,
  ].join('\n');
}
