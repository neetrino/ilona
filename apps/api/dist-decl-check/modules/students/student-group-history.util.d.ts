import type { Prisma } from '@ilona/database';
export declare function syncStudentGroupHistory(tx: Prisma.TransactionClient, studentId: string, previousGroupId: string | null, nextGroupId: string | null, joinedAt?: Date): Promise<void>;
