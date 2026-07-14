import { PrismaService } from '../prisma/prisma.service';
import type { GlobalSearchResult } from './types/search-result.type';
export declare class SearchRoleQueryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchTeacherEntities(userId: string, tokens: string[], take: number): Promise<GlobalSearchResult[]>;
    searchStudentEntities(userId: string, tokens: string[], normalizedPhrase: string, take: number): Promise<GlobalSearchResult[]>;
}
