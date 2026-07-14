import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';
import { Prisma } from '@ilona/database';
import { GroupScheduleLessonsService } from '../lessons/group-schedule-lessons.service';
import { JwtPayload } from '../../common/types/auth.types';
import { GroupAccessService } from './group-access.service';
import { GroupTeacherValidationService } from './group-teacher-validation.service';
import { GroupChatSyncService } from './group-chat-sync.service';
import { GroupQueryService } from './group-query.service';
export declare class GroupWriteService {
    private readonly prisma;
    private readonly accessService;
    private readonly teacherValidation;
    private readonly chatSync;
    private readonly queryService;
    private readonly groupScheduleLessonsService;
    constructor(prisma: PrismaService, accessService: GroupAccessService, teacherValidation: GroupTeacherValidationService, chatSync: GroupChatSyncService, queryService: GroupQueryService, groupScheduleLessonsService: GroupScheduleLessonsService);
    create(dto: CreateGroupDto, currentUser?: JwtPayload): Promise<{
        center: {
            name: string;
            id: string;
        };
        teacher: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        }) | null;
        secondTeacher: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        }) | null;
    } & {
        name: string;
        centerId: string;
        teacherId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        iconKey: string | null;
        level: string | null;
        maxStudents: number;
        secondTeacherId: string | null;
        secondTeacherStartsFirstWeek: boolean;
        schedule: Prisma.JsonValue | null;
    }>;
    update(id: string, dto: UpdateGroupDto, currentUser?: JwtPayload): Promise<{
        center: {
            name: string;
            id: string;
        };
        teacher: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        }) | null;
        secondTeacher: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            specialization: string | null;
            hourlyRate: Prisma.Decimal;
            lessonRateAMD: Prisma.Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: Prisma.JsonValue | null;
            hireDate: Date | null;
        }) | null;
    } & {
        name: string;
        centerId: string;
        teacherId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        iconKey: string | null;
        level: string | null;
        maxStudents: number;
        secondTeacherId: string | null;
        secondTeacherStartsFirstWeek: boolean;
        schedule: Prisma.JsonValue | null;
    }>;
    delete(id: string, currentUser?: JwtPayload): Promise<{
        name: string;
        centerId: string;
        teacherId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        iconKey: string | null;
        level: string | null;
        maxStudents: number;
        secondTeacherId: string | null;
        secondTeacherStartsFirstWeek: boolean;
        schedule: Prisma.JsonValue | null;
    }>;
    toggleActive(id: string, currentUser?: JwtPayload): Promise<{
        name: string;
        centerId: string;
        teacherId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        iconKey: string | null;
        level: string | null;
        maxStudents: number;
        secondTeacherId: string | null;
        secondTeacherStartsFirstWeek: boolean;
        schedule: Prisma.JsonValue | null;
    }>;
}
