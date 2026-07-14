import { UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
export declare class AttendanceScopeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getManagerCenterId(userId?: string, userRole?: UserRole): Promise<string | null>;
}
