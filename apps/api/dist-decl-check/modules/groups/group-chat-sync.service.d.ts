import { PrismaService } from '../prisma/prisma.service';
export declare class GroupChatSyncService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createGroupChat(groupId: string, groupName: string, teacherIds?: string | string[]): Promise<{
        name: string | null;
        groupId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@ilona/database").$Enums.ChatType;
        isActive: boolean;
    }>;
    syncGroupTeachersInChat(groupId: string, groupName: string, teacherIds: Array<string | null | undefined>): Promise<void>;
    removeTeachersFromGroupChat(groupId: string, oldTeacherIds: Array<string | null | undefined>): Promise<void>;
}
