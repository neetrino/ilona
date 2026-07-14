import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class GroupAccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertManagerGroupAccess(groupId: string, user?: JwtPayload): Promise<void>;
}
