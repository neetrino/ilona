import type { AdminStudentRecordingFilters } from './message.types';
export declare function normalizeStringArray(value?: string | string[]): string[];
export declare function adminRecordingMatchesFilters(senderId: string, groupId: string | null, filters: AdminStudentRecordingFilters): boolean;
