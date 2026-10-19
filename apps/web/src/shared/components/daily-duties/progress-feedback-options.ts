export const PROGRESS_AREA_OPTIONS = [
  'Grammar',
  'Vocabulary',
  'Speaking',
  'Listening',
  'Reading',
  'Writing',
  'Pronunciation',
  'Fluency',
  'other',
] as const;

export type ProgressAreaOption = (typeof PROGRESS_AREA_OPTIONS)[number];

export const PROGRESS_OTHER_VALUE = 'other' as const;

/** Topics by progress area. Vocabulary and top-level `other` have no topic list. */
export const PROGRESS_TOPICS_BY_AREA: Record<ProgressAreaOption, readonly string[]> = {
  Grammar: [
    'Tenses',
    'Conditionals',
    'Modals',
    'Articles',
    'Passive Voice',
    'Reported Speech',
    'Inversions',
    'Relative Clauses',
    'Gerunds & Infinitives',
    PROGRESS_OTHER_VALUE,
  ],
  Vocabulary: [],
  Speaking: ['Confidence', 'Vocabulary use', 'Expressing opinions', PROGRESS_OTHER_VALUE],
  Listening: [
    'Understanding main ideas',
    'Detail questions',
    'Note-taking',
    PROGRESS_OTHER_VALUE,
  ],
  Reading: ['Skimming & scanning', 'Comprehension', 'Inference', PROGRESS_OTHER_VALUE],
  Writing: ['Structure', 'Accuracy', 'Vocabulary range', PROGRESS_OTHER_VALUE],
  Pronunciation: ['Sounds', 'Intonation', 'Word stress', PROGRESS_OTHER_VALUE],
  Fluency: ['Pace', 'Connecting ideas', 'Spontaneity', PROGRESS_OTHER_VALUE],
  other: [],
};

export function progressAreaHasTopicDropdown(area: ProgressAreaOption | ''): boolean {
  if (!area || area === PROGRESS_OTHER_VALUE) return false;
  return PROGRESS_TOPICS_BY_AREA[area].length > 0;
}

export function resolveProgressAreaLabel(
  area: ProgressAreaOption | '',
  areaCustom: string,
): string {
  if (!area) return '';
  if (area === PROGRESS_OTHER_VALUE) return areaCustom.trim();
  return area;
}

export function resolveProgressTopicLabel(
  topic: string,
  topicCustom: string,
): string {
  if (!topic) return '';
  if (topic === PROGRESS_OTHER_VALUE) return topicCustom.trim();
  return topic;
}
