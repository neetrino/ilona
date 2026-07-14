import type { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
type CrmLeadWhereInput = Prisma.CrmLeadWhereInput;
export declare class LeadAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    applyManagerScope(where: CrmLeadWhereInput, user?: JwtPayload): CrmLeadWhereInput;
    requireAdminForCrmLeadVoice(user?: JwtPayload): void;
    ensureAdminForVoiceRecordingsHistory(user?: JwtPayload): void;
    ensureManagerCenterInput(centerId: string | undefined, user?: JwtPayload): string | undefined;
    assertManagerLeadTeacherInCenter(teacherId: string | undefined | null, user?: JwtPayload): Promise<void>;
}
export {};
