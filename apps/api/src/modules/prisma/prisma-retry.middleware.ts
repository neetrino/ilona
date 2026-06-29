import { Logger } from '@nestjs/common';
import type { PrismaClient } from '@ilona/database';
import {
  isConnectionError,
  isTransientConnectionError,
  withRetry,
} from './prisma-connection.util';

export interface PrismaRetryMiddlewareDeps {
  logger: Logger;
  safeReconnect: () => Promise<void>;
  markDisconnected: () => void;
}

export function registerPrismaRetryMiddleware(
  prisma: PrismaClient,
  deps: PrismaRetryMiddlewareDeps,
): void {
  const { logger, safeReconnect, markDisconnected } = deps;

  prisma.$use(async (params, next) => {
    try {
      const result: unknown = await withRetry(
        async (): Promise<unknown> => {
          const nextResult: unknown = await next(params);
          return nextResult;
        },
        async (_error, attempt) => {
          logger.warn(
            `Connection error detected (attempt ${attempt + 1}/3), forcing disconnect and reconnect`,
          );
          markDisconnected();
          await safeReconnect();
          await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
        },
        3,
        150,
      );
      return result;
    } catch (error) {
      if (isTransientConnectionError(error)) {
        markDisconnected();

        safeReconnect().catch((reconnectError) => {
          logger.warn('Could not reconnect after error', reconnectError);
        });

        const errorInfo: {
          code?: string | number;
          message?: string;
          name?: string;
          cause?: string | number;
        } = {
          name: error instanceof Error ? error.name : undefined,
          message: error instanceof Error ? error.message?.substring(0, 200) : undefined,
        };

        if (isConnectionError(error)) {
          errorInfo.code = error.code;
          errorInfo.cause = error.cause?.code || error.cause?.message?.substring(0, 100);
        }

        logger.error(
          `Database connection error (transient) - Operation: ${params.model}.${params.action}`,
          JSON.stringify(errorInfo),
        );
      }
      throw error;
    }
  });
}
