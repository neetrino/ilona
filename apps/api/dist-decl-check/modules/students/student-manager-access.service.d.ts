import { UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
export declare class StudentManagerAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertManagerStudentAccess(studentId: string, currentUserId?: string, userRole?: UserRole): Promise<void>;
}
