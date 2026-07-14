import { PrismaService } from '../prisma/prisma.service';
export declare class ChatUnreadCountService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getParticipantLastReadMap(chatIds: string[], userId: string): Promise<Map<string, Date | null>>;
    countUnreadAfterLastRead(entries: Array<{
        chatId: string;
        lastReadAt: Date;
    }>, userId: string, logContext: string): Promise<Map<string, number>>;
    countUnreadNeverReadForGroups(chatIds: string[], userId: string): Promise<Map<string, number>>;
    getSingleChatUnreadCount(chatId: string, userId: string, lastReadAt: Date | null | undefined, _totalMessageCount?: number): Promise<number>;
}
