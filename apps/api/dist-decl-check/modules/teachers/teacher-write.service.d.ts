import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { TeacherReadService } from './teacher-read.service';
export declare class TeacherWriteService {
    private readonly prisma;
    private readonly readService;
    constructor(prisma: PrismaService, readService: TeacherReadService);
    create(dto: CreateTeacherDto, _currentUser?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        bio: string | null;
        specialization: string | null;
        hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
        videoUrl: string | null;
        workingDays: string[];
        workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
        hireDate: Date | null;
    }>;
    update(id: string, dto: UpdateTeacherDto, currentUser?: JwtPayload): Promise<{
        user: {
            status: import("@ilona/database").$Enums.UserStatus;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        bio: string | null;
        specialization: string | null;
        hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
        lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
        videoUrl: string | null;
        workingDays: string[];
        workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
        hireDate: Date | null;
    }>;
    private syncTeacherCenters;
    delete(id: string, currentUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
    deleteMany(ids: string[], currentUser?: JwtPayload): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
}
