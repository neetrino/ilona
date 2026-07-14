import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class StudentGroupService {
    private readonly prisma;
    private readonly chatService;
    constructor(prisma: PrismaService, chatService: ChatService);
    changeGroup(id: string, newGroupId: string | null, user?: JwtPayload): Promise<unknown>;
}
