import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@ilona/database';
export declare function ensurePlannedAbsencesTable(prisma: Pick<PrismaClient, '$queryRawUnsafe' | '$executeRawUnsafe'>, logger: Logger): Promise<void>;
