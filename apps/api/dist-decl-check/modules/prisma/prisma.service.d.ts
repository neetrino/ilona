import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@ilona/database';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { ServerActivityService } from '../../common/server-activity/server-activity.service';
import type { RetryContext } from './prisma.types';
export type { RetryContext } from './prisma.types';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly requestContext;
    private readonly serverActivity;
    private readonly logger;
    private isConnected;
    private healthCheckInterval?;
    private readonly healthCheckIntervalMs;
    private readonly healthCheckIdleThresholdMs;
    private isReconnecting;
    private reconnectPromise;
    private lastReconnectAt;
    private readonly reconnectCooldownMs;
    private readonly startupRetries;
    private readonly startupRetryDelays;
    constructor(requestContext: RequestContextService, serverActivity: ServerActivityService);
    onModuleInit(): Promise<void>;
    private startHealthCheck;
    onModuleDestroy(): Promise<void>;
    checkHealth(): Promise<{
        healthy: boolean;
        latency?: number;
        error?: string;
    }>;
    ensureConnected(): Promise<void>;
    private safeReconnect;
    prismaWithRetry<T>(fn: () => Promise<T>, ctx: RetryContext): Promise<T>;
}
