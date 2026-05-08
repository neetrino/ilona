export const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

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

export interface StructuredFeedbackFields {
  level: string;
  grammar: string[];
  speaking: boolean;
  writing: boolean;
  skillsComment: string;
  comment: string;
  participation: ParticipationOption | null;
  progress: string;
  encouragement: string;
}

export function emptyStructuredFeedback(): StructuredFeedbackFields {
  return {
    level: '',
    grammar: [],
    speaking: false,
    writing: false,
    skillsComment: '',
    comment: '',
    participation: null,
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
  return {
    ...parsed,
    level: (saved.level ?? parsed.level) || '',
    grammar: saved.grammarTopics?.length ? [...saved.grammarTopics] : parsed.grammar,
    speaking,
    writing,
    skillsComment,
    participation:
      saved.participation != null
        ? participationFromRating(saved.participation) ?? parsed.participation
        : parsed.participation,
    progress: saved.progress ?? parsed.progress,
    encouragement: saved.encouragement ?? parsed.encouragement,
  };
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
    level,
    grammar,
    ...skills,
    comment,
    participation,
    progress,
    encouragement,
  };
}

export function participationToRating(option: ParticipationOption | null): number | undefined {
  if (!option) return undefined;
  const idx = PARTICIPATION_OPTIONS.indexOf(option);
  return idx >= 0 ? idx + 1 : undefined;
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

  const narrative = [structured.comment, structured.progress, structured.encouragement]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n\n');

  return [
    `Level: ${structured.level}`,
    `Grammar: ${structured.grammar.join(', ')}`,
    `Skills: ${skillsLine}`,
    `Comment: ${structured.comment.trim() || '-'}`,
    `Participation: ${structured.participation ?? 'off'}`,
    `Progress: ${structured.progress.trim() || '-'}`,
    `Encouragement: ${structured.encouragement.trim() || '-'}`,
    '',
    `Feedback: ${narrative || '—'}`,
  ].join('\n');
}
