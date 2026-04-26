/**
 * Predefined group icons (stored as `Group.iconKey`). Keys map to Lucide icons in the web app.
 * Curated for English / language-center groups; existing keys are preserved for backward compatibility.
 */
export const GROUP_ICON_DEFINITIONS = [
  // Language & communication
  { key: 'languages', label: 'Languages & translation' },
  { key: 'globe', label: 'Global English' },
  { key: 'book', label: 'Course book' },
  { key: 'book-open', label: 'Open book' },
  { key: 'message-square', label: 'Chat' },
  { key: 'message-circle', label: 'Discussion' },
  { key: 'mic', label: 'Speaking' },
  { key: 'headphones', label: 'Listening' },
  { key: 'volume-2', label: 'Pronunciation & audio' },
  // Reading, writing & language accuracy
  { key: 'scroll-text', label: 'Reading & texts' },
  { key: 'file-text', label: 'Worksheets & handouts' },
  { key: 'type', label: 'Writing & typing' },
  { key: 'list-ordered', label: 'Grammar & structure' },
  { key: 'spell-check-2', label: 'Spelling' },
  { key: 'quote', label: 'Quotes & literature' },
  { key: 'pen-line', label: 'Pen' },
  { key: 'pencil', label: 'Notes & drafts' },
  { key: 'notebook-pen', label: 'Practice journal' },
  { key: 'book-marked', label: 'Bookmarked study' },
  // People & place
  { key: 'users-round', label: 'Small group' },
  { key: 'users', label: 'Class' },
  { key: 'handshake', label: 'Pair & partner work' },
  { key: 'school', label: 'School' },
  { key: 'library', label: 'Library' },
  { key: 'landmark', label: 'Center' },
  { key: 'building-2', label: 'Branch' },
  { key: 'backpack', label: 'Learners' },
  { key: 'presentation', label: 'Presentation skills' },
  // Progress & achievement
  { key: 'graduation-cap', label: 'Graduation' },
  { key: 'star', label: 'Star performance' },
  { key: 'trophy', label: 'Trophy' },
  { key: 'medal', label: 'Medal' },
  { key: 'award', label: 'Certificate' },
  { key: 'badge-check', label: 'Level completed' },
  { key: 'trending-up', label: 'Progress' },
  { key: 'target', label: 'Learning goals' },
  { key: 'sparkles', label: 'Highlights' },
  // General learning
  { key: 'brain', label: 'Thinking skills' },
  { key: 'lightbulb', label: 'Ideas' },
  { key: 'calendar-days', label: 'Schedule' },
  { key: 'clipboard-list', label: 'Tasks & checklists' },
] as const;

export type GroupIconKey = (typeof GROUP_ICON_DEFINITIONS)[number]['key'];

export const GROUP_ICON_KEYS: readonly GroupIconKey[] = GROUP_ICON_DEFINITIONS.map(
  (d): GroupIconKey => d.key,
);

const KEY_SET: ReadonlySet<string> = new Set(GROUP_ICON_KEYS);

export function isGroupIconKey(value: unknown): value is GroupIconKey {
  return typeof value === 'string' && KEY_SET.has(value);
}
