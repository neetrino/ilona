import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@ilona/database';
export interface PrismaRetryMiddlewareDeps {
    logger: Logger;
    safeReconnect: () => Promise<void>;
    markDisconnected: () => void;
}
export declare function registerPrismaRetryMiddleware(prisma: PrismaClient, deps: PrismaRetryMiddlewareDeps): void;
