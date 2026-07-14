import { JwtPayload } from '../../common/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from './salaries.service';
export declare class FinanceControllerScopeService {
    private readonly prisma;
    private readonly salariesService;
    constructor(prisma: PrismaService, salariesService: SalariesService);
    ensureTeacherSalaryRecords(teacherId: string): Promise<void>;
    getCurrentStudentOrThrow(user: JwtPayload): Promise<{
        id: string;
    }>;
    assertManagerCanReadTeacher(user: JwtPayload, teacherId: string): Promise<void>;
}
