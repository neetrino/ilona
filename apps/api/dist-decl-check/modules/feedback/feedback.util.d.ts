import type { Prisma } from '@ilona/database';
import type { UpdateFeedbackDto } from './dto';
export declare function buildStructuredFields(dto: Pick<UpdateFeedbackDto, 'level' | 'grammarTopics' | 'skills' | 'skillsNote' | 'participation' | 'progress' | 'encouragement'>): Prisma.FeedbackUpdateInput;
