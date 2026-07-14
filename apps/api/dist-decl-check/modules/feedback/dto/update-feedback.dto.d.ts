import { FeedbackCefrLevel } from './create-feedback.dto';
export declare class UpdateFeedbackDto {
    content?: string;
    rating?: number;
    strengths?: string;
    improvements?: string;
    level?: FeedbackCefrLevel | null;
    grammarTopics?: string[];
    skills?: string[];
    skillsNote?: string | null;
    participation?: number | null;
    progress?: string | null;
    encouragement?: string | null;
}
