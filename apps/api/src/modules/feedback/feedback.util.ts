import type { Prisma } from '@ilona/database';
import type { UpdateFeedbackDto } from './dto';

/** Only sets fields explicitly included so partial updates do not wipe saved values. */
export function buildStructuredFields(
  dto: Pick<
    UpdateFeedbackDto,
    | 'level'
    | 'grammarTopics'
    | 'skills'
    | 'skillsNote'
    | 'participation'
    | 'progress'
    | 'encouragement'
  >,
): Prisma.FeedbackUpdateInput {
  const payload: Prisma.FeedbackUpdateInput = {};
  if (dto.level !== undefined) payload.level = dto.level ?? null;
  if (dto.grammarTopics !== undefined) payload.grammarTopics = dto.grammarTopics;
  if (dto.skills !== undefined) payload.skills = dto.skills;
  if (dto.skillsNote !== undefined) payload.skillsNote = dto.skillsNote ?? null;
  if (dto.participation !== undefined) payload.participation = dto.participation ?? null;
  if (dto.progress !== undefined) payload.progress = dto.progress ?? null;
  if (dto.encouragement !== undefined) payload.encouragement = dto.encouragement ?? null;
  return payload;
}
