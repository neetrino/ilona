import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { StudentManagerAccessService } from './student-manager-access.service';
import { StudentReadService } from './student-read.service';
export declare class StudentUpdateService {
    private readonly prisma;
    private readonly managerAccess;
    private readonly readService;
    constructor(prisma: PrismaService, managerAccess: StudentManagerAccessService, readService: StudentReadService);
    update(id: string, dto: UpdateStudentDto, user?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
        center: {
            name: string;
            id: string;
        } | null;
        group: {
            name: string;
            center: {
                name: string;
                id: string;
            };
            id: string;
            level: string | null;
        } | null;
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string | null;
            };
            id: string;
        } | null;
    } & {
        status: import("@ilona/database").$Enums.StudentStatus;
        groupId: string | null;
        centerId: string | null;
        teacherId: string | null;
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        age: number | null;
        dateOfBirth: Date | null;
        parentName: string | null;
        parentPhone: string | null;
        parentEmail: string | null;
        parentPassportInfo: string | null;
        firstLessonDate: Date | null;
        notes: string | null;
        currentStreak: number;
        riskLabel: import("@ilona/database").$Enums.RiskLabel;
        monthlyFee: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        enrolledAt: Date;
        registerDate: Date | null;
        receiveReports: boolean;
        leadId: string | null;
    }>;
}
