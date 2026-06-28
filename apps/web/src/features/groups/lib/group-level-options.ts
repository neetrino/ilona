export const GROUP_LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type GroupLevelOption = (typeof GROUP_LEVEL_OPTIONS)[number];

export const DEFAULT_GROUP_LEVEL: GroupLevelOption = GROUP_LEVEL_OPTIONS[0];

export const GROUP_LEVEL_SEGMENT_OPTIONS = GROUP_LEVEL_OPTIONS.map((level) => ({
  id: level,
  label: level,
}));
