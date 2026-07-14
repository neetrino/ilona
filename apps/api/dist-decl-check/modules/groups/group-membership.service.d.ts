import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { JwtPayload } from '../../common/types/auth.types';
import { GroupAccessService } from './group-access.service';
import { GroupQueryService } from './group-query.service';
export declare class GroupMembershipService {
    private readonly prisma;
    private readonly chatService;
    private readonly accessService;
    private readonly queryService;
    constructor(prisma: PrismaService, chatService: ChatService, accessService: GroupAccessService, queryService: GroupQueryService);
    assignTeacher(groupId: string, teacherId: string, currentUser?: JwtPayload): Promise<{
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
            hourlyRate: import("@ilona/database/dist/generated/client/runtime/library").Decimal;
            lessonRateAMD: import("@ilona/database/dist/generated/client/runtime/library").Decimal | null;
            videoUrl: string | null;
            workingDays: string[];
            workingHours: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
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
        schedule: import("@ilona/database/dist/generated/client/runtime/library").JsonValue | null;
    }>;
    addStudent(groupId: string, studentId: string, currentUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
    removeStudent(groupId: string, studentId: string, currentUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
}
