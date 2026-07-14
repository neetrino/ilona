import { PrismaService } from '../prisma/prisma.service';
import { CrmLeadActivityType, Prisma } from '@ilona/database';
import { AddCommentDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadReadService } from './lead-read.service';
export declare class LeadActivityService {
    private readonly prisma;
    private readonly readService;
    constructor(prisma: PrismaService, readService: LeadReadService);
    logActivity(leadId: string, actorUserId: string, type: CrmLeadActivityType, payload: Record<string, unknown>): Promise<void>;
    getActivities(leadId: string, user?: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import("@ilona/database").$Enums.CrmLeadActivityType;
        leadId: string;
        actorUserId: string | null;
        payload: Prisma.JsonValue | null;
    }[]>;
    addComment(leadId: string, dto: AddCommentDto, actorUserId: string, user?: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        type: import("@ilona/database").$Enums.CrmLeadActivityType;
        leadId: string;
        actorUserId: string | null;
        payload: Prisma.JsonValue | null;
    }[]>;
}
