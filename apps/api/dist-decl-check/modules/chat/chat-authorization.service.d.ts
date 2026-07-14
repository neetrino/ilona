import { PrismaService } from '../prisma/prisma.service';
export declare class ChatAuthorizationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    canTeacherAccessGroupChat(teacherUserId: string, groupId: string): Promise<{
        hasAccess: boolean;
        debug?: {
            teacherId?: string;
            groupTeacherId?: string | null;
            groupSecondTeacherId?: string | null;
            hasLessons: boolean;
            hasSubstituteLessons: boolean;
        };
    }>;
    ensureTeacherInGroupChat(chatId: string, teacherUserId: string): Promise<void>;
    validateStudentTeacherDM(studentUserId: string, teacherUserId: string): Promise<boolean>;
}
