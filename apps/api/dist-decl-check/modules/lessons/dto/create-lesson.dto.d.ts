import { LessonCreationSource } from '@ilona/database';
export declare class CreateLessonDto {
    groupId: string;
    teacherId: string;
    scheduledAt: string;
    duration?: number;
    topic?: string;
    description?: string;
    creationSource?: LessonCreationSource;
}
