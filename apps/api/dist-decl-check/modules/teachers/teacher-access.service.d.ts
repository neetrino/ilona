import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class TeacherAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertManagerTeacherAccess(teacherId: string, currentUser?: JwtPayload): Promise<void>;
}
