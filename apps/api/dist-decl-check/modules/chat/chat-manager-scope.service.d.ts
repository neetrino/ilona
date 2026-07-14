import { PrismaService } from '../prisma/prisma.service';
import { ChatType } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
export type ChatScopeShape = {
    id: string;
    type: ChatType;
    groupId: string | null;
    group?: {
        center?: {
            id: string;
        } | null;
    } | null;
    participants: {
        userId: string;
    }[];
};
export declare class ChatManagerScopeService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    managerCenterIdFromJwt(user: JwtPayload | undefined): string | undefined;
    isStudentUserInBranch(studentUserId: string, centerId: string): Promise<boolean>;
    isTeacherUserInBranch(teacherUserId: string, centerId: string): Promise<boolean>;
    isUserInManagerBranch(userId: string, centerId: string): Promise<boolean>;
    private isHistoricalChatParticipant;
    isChatInManagerBranch(chat: ChatScopeShape, managerUserId: string, centerId: string): Promise<boolean>;
    assertManagerCanAccessChat(chat: ChatScopeShape, managerUserId: string, centerId: string): Promise<void>;
    canManagerDirectMessageUser(managerUserId: string, otherUserId: string): Promise<boolean>;
}
