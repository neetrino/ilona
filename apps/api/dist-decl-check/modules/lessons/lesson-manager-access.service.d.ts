import { UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
export declare class LessonManagerAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getManagerCenterId(currentUserId?: string, userRole?: UserRole): Promise<string | null>;
}
