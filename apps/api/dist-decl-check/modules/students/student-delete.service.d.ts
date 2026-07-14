import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
import { StudentManagerAccessService } from './student-manager-access.service';
import { StudentReadService } from './student-read.service';
export declare class StudentDeleteService {
    private readonly prisma;
    private readonly managerAccess;
    private readonly readService;
    constructor(prisma: PrismaService, managerAccess: StudentManagerAccessService, readService: StudentReadService);
    delete(id: string, user?: JwtPayload): Promise<{
        success: boolean;
    }>;
    deleteMany(ids: string[], user?: JwtPayload): Promise<{
        success: boolean;
        deleted: number;
    }>;
}
