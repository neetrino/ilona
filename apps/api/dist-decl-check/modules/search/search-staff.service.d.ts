import { PrismaService } from '../prisma/prisma.service';
import type { GlobalSearchResult } from './types/search-result.type';
export declare class SearchStaffService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchStudentsStaff(tokens: string[], take: number, centerId: string | undefined): Promise<GlobalSearchResult[]>;
    searchTeachersStaff(tokens: string[], take: number, centerId: string | undefined): Promise<GlobalSearchResult[]>;
    searchGroupsStaff(tokens: string[], take: number, centerId: string | undefined): Promise<GlobalSearchResult[]>;
    searchCrmLeadsStaff(tokens: string[], take: number, centerId: string | undefined): Promise<GlobalSearchResult[]>;
    searchLessonsStaff(tokens: string[], take: number, centerId: string | undefined): Promise<GlobalSearchResult[]>;
    searchPaymentsStaff(tokens: string[], normalizedPhrase: string, take: number, centerId: string | undefined): Promise<GlobalSearchResult[]>;
    searchRecordingsStaff(tokens: string[], normalizedPhrase: string, take: number, centerId: string | undefined): Promise<GlobalSearchResult[]>;
}
