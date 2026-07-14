import type { PrismaService } from '../../modules/prisma/prisma.service';
export declare const currentManagerAssignmentWhere: {
    readonly isCurrentAssignment: true;
};
export declare function findCurrentManagerUserIdForCenter(prisma: PrismaService, centerId: string): Promise<string | null>;
