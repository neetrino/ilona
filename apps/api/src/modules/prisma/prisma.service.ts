import { Injectable, OnModuleInit, OnModuleDestroy, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaClient } from '@ilona/database';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { ServerActivityService } from '../../common/server-activity/server-activity.service';
import {
  extractPrismaErrorCode,
  isTransientConnectionError,
} from './prisma-connection.util';
import { ensurePlannedAbsencesTable } from './prisma-planned-absences.util';
import { ensurePenaltyAmountColumns } from './prisma-penalty-columns.util';
import { registerPrismaRetryMiddleware } from './prisma-retry.middleware';
import type { RetryContext } from './prisma.types';

export type { RetryContext } from './prisma.types';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly healthCheckIntervalMs = 30000;
  private readonly healthCheckIdleThresholdMs = 2 * 60 * 1000;
  private isReconnecting = false;
  private reconnectPromise: Promise<void> | null = null;
  private lastReconnectAt: number = 0;
  private readonly reconnectCooldownMs = 2000;
  private readonly startupRetries = 6;
  private readonly startupRetryDelays = [5000, 5000, 10000, 15000, 20000, 25000];

  constructor(
    private readonly requestContext: RequestContextService,
    private readonly serverActivity: ServerActivityService,
  ) {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
      errorFormat: 'pretty',
    });
    registerPrismaRetryMiddleware(this, {
      logger: this.logger,
      safeReconnect: () => this.safeReconnect(),
      markDisconnected: () => {
        this.isConnected = false;
      },
    });
  }

  async onModuleInit() {
    this.$use(async (params, next) => {
      const store = this.requestContext.getStore();
      const start = Date.now();
      const result = (await next(params)) as unknown;
      if (store) {
        store.dbQueryCount += 1;
        store.dbTimeMs += Date.now() - start;
      }
      return result;
    });

    const isStartupConnectionError = (e: unknown) => {
      if (!(e && typeof e === 'object')) return false;
      const code = (e as { code?: string }).code;
      return code === 'P1001' || code === 'P1002' || code === 'P1008';
    };

    let lastError: unknown;
    for (let attempt = 0; attempt < this.startupRetries; attempt++) {
      const delay = this.startupRetryDelays[attempt] ?? 0;
      if (delay > 0) {
        this.logger.warn(
          `Database unreachable (attempt ${attempt + 1}/${this.startupRetries}), retrying in ${delay / 1000}s...`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Database connected successfully');
        await ensurePlannedAbsencesTable(this, this.logger);
        await ensurePenaltyAmountColumns(this, this.logger);
        this.startHealthCheck();
        return;
      } catch (error) {
        lastError = error;
        if (attempt < this.startupRetries - 1 && isStartupConnectionError(error)) {
          continue;
        }
        this.isConnected = false;
        this.logger.error('Failed to connect to database on startup', error);
        throw error;
      }
    }
    this.isConnected = false;
    this.logger.error('Failed to connect to database on startup', lastError);
    throw lastError;
  }

  private startHealthCheck(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      void (async () => {
        const lastAt = this.serverActivity.getLastActivityAt();
        if (lastAt === 0) return;
        if (Date.now() - lastAt > this.healthCheckIdleThresholdMs) return;
        try {
          await this.$queryRaw`SELECT 1`;
          if (!this.isConnected) {
            this.isConnected = true;
            this.logger.debug('Connection verified via health check');
          }
        } catch (error) {
          if (isTransientConnectionError(error)) {
            this.isConnected = false;
            this.logger.warn('Health check detected connection issue, attempting reconnect');
            try {
              await this.safeReconnect();
            } catch {
              this.logger.warn('Failed to reconnect via health check');
            }
          } else {
            this.logger.warn(`Health check failed with non-transient error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      })();
    }, this.healthCheckIntervalMs);
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      this.isConnected = true;
      return { healthy: true, latency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      try {
        await this.safeReconnect();
      } catch {
        this.logger.warn('Could not reconnect during health check');
      }

      return { healthy: false, error: errorMessage.substring(0, 200) };
    }
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.safeReconnect();
    }
  }

  private async safeReconnect(): Promise<void> {
    if (this.isReconnecting && this.reconnectPromise) {
      return this.reconnectPromise;
    }

    const timeSinceLastReconnect = Date.now() - this.lastReconnectAt;
    if (timeSinceLastReconnect < this.reconnectCooldownMs) {
      const waitTime = this.reconnectCooldownMs - timeSinceLastReconnect;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.isReconnecting = true;
    this.reconnectPromise = (async () => {
      try {
        try {
          await this.$disconnect();
        } catch {
          // Ignore disconnect errors - connection may already be closed
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        await this.$connect();
        this.isConnected = true;
        this.lastReconnectAt = Date.now();
        this.logger.log('Database reconnected successfully');
      } catch (reconnectError) {
        this.isConnected = false;
        this.logger.warn('Failed to reconnect, will retry on next operation');
        throw reconnectError;
      } finally {
        this.isReconnecting = false;
        this.reconnectPromise = null;
      }
    })();

    return this.reconnectPromise;
  }

  async prismaWithRetry<T>(fn: () => Promise<T>, ctx: RetryContext): Promise<T> {
    const { op, meta } = ctx;
    let lastError: unknown;
    let firstErrorLogged = false;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (!isTransientConnectionError(error)) {
          throw error;
        }

        if (!firstErrorLogged) {
          firstErrorLogged = true;
          const errorCode = extractPrismaErrorCode(error);
          const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
          this.logger.warn(
            `Transient DB error in ${op} (attempt ${attempt + 1}/3) | Code: ${errorCode}${metaStr}`,
          );
        }

        if (attempt === 2) {
          break;
        }

        try {
          await this.safeReconnect();
        } catch {
          this.logger.warn(`Reconnect attempt failed for ${op}, will retry operation`);
        }

        const baseDelay = 150 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 100);
        const delay = baseDelay + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    const errorCode = extractPrismaErrorCode(lastError);
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    this.logger.error(
      `DB connection exhausted for ${op} after 3 attempts | Code: ${errorCode}${metaStr}`,
    );

    throw new ServiceUnavailableException(
      'Database connection temporarily unavailable. Please retry.',
    );
  }
}
