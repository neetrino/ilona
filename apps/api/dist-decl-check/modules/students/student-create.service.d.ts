import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto';
import { Prisma } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
export declare class StudentCreateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private prepareStudentCreate;
    private insertUserStudentAndRelationsInTx;
    create(dto: CreateStudentDto, user?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
        group: {
            name: string;
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
        monthlyFee: Prisma.Decimal;
        enrolledAt: Date;
        registerDate: Date | null;
        receiveReports: boolean;
        leadId: string | null;
    }>;
    createLinkedToCrmPaidLead(leadId: string, dto: CreateStudentDto, actorUserId: string, user?: JwtPayload): Promise<void>;
}
