import type { ConnectionError } from './prisma.types';
export declare function isConnectionError(error: unknown): error is ConnectionError;
export declare function hasConnectionErrorCode(error: unknown, targetCode: string | number): boolean;
export declare function isTransientConnectionError(error: unknown): boolean;
export declare function withRetry<T>(fn: () => Promise<T>, onRetry?: (error: unknown, attempt: number) => Promise<void>, maxRetries?: number, baseDelay?: number): Promise<T>;
export declare function extractPrismaErrorCode(error: unknown): string;
