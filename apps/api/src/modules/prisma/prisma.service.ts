import { Injectable, OnModuleInit, OnModuleDestroy, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Type for connection error with code and cause information
 */
interface ConnectionError extends Error {
  code?: string | number;
  cause?: {
    code?: string | number;
    message?: string;
  };
}

/**
 * Type guard to check if error has connection error properties
 */
function isConnectionError(error: unknown): error is ConnectionError {
  if (!(error instanceof Error)) return false;
  const err = error as Partial<ConnectionError>;
  return (
    typeof err.code !== 'undefined' ||
    typeof err.cause !== 'undefined' ||
    err.name === 'ConnectionReset'
  );
}

/**
 * Deep check for connection error codes in nested error structures.
 * Handles Rust-style error structures from Prisma (kind: Io, cause: Some(Os { code: 10054 }))
 */
function hasConnectionErrorCode(error: unknown, targetCode: string | number): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as any;
  
  // Check direct code
  if (err.code === targetCode || err.code === String(targetCode)) {
    return true;
  }
  
  // Check cause.code
  if (err.cause?.code === targetCode || err.cause?.code === String(targetCode)) {
    return true;
  }
  
  // Check nested cause structures (Rust-style: cause: Some(Os { code: 10054 }))
  if (err.cause && typeof err.cause === 'object') {
    const cause = err.cause;
    if (cause.code === targetCode || cause.code === String(targetCode)) {
      return true;
    }
    // Handle nested structures
    if (cause.cause?.code === targetCode || cause.cause?.code === String(targetCode)) {
      return true;
    }
  }
  
  // Check error message for code references
  const message = String(err.message || '').toLowerCase();
  if (message.includes(`code ${targetCode}`) || message.includes(`code: ${targetCode}`)) {
    return true;
  }
  
  return false;
}

/**
 * Checks if an error is a transient database connection error that should be retried.
 */
function isTransientConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Prisma error codes for connection issues
  const prismaConnectionErrorCodes = [
    'P1001', // Can't reach database server
    'P1002', // Database server closed the connection
    'P1008', // Operations timed out
    'P1017', // Server has closed the connection
  ];

  // Check for PrismaClientKnownRequestError with connection error codes
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return prismaConnectionErrorCodes.includes(error.code);
  }

  // Check for Windows error code 10054 (connection forcibly closed)
  if (hasConnectionErrorCode(error, 10054) || hasConnectionErrorCode(error, '10054')) {
    return true;
  }

  // Check for common network/connection error codes
  const networkErrorCodes = ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED'];
  for (const code of networkErrorCodes) {
    if (hasConnectionErrorCode(error, code)) {
      return true;
    }
  }

  // Check for PrismaClientUnknownRequestError (connection reset, etc.)
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('server has closed the connection') ||
      message.includes('connection reset') ||
      message.includes('econnreset') ||
      message.includes('connection closed') ||
      message.includes('socket hang up') ||
      message.includes('io(connectionreset') ||
      message.includes('io(connection reset') ||
      message.includes('os code 10054') ||
      message.includes('code: 10054') ||
      message.includes('forcibly closed by the remote host') ||
      message.includes('error in postgresql connection') ||
      message.includes('error in postgresql connection: error')
    );
  }

  // Check for generic connection errors
  const message = error.message.toLowerCase();
  const err = error as any;
  
  return (
    message.includes('econnreset') ||
    message.includes('connection reset') ||
    message.includes('server has closed the connection') ||
    message.includes('connection closed') ||
    message.includes('socket hang up') ||
    message.includes('io(connectionreset') ||
    message.includes('io(connection reset') ||
    message.includes('os code 10054') ||
    message.includes('code: 10054') ||
    message.includes('forcibly closed by the remote host') ||
    message.includes('error in postgresql connection') ||
    error.name === 'ConnectionReset' ||
    err.code === 'ECONNRESET' ||
    err.code === 10054 ||
    err.code === '10054' ||
    (err.cause?.code === 'ECONNRESET') ||
    (err.cause?.code === 10054) ||
    (err.cause?.code === '10054') ||
    Boolean(err.cause?.message && err.cause.message.toLowerCase().includes('connectionreset')) ||
    Boolean(err.cause?.message && err.cause.message.toLowerCase().includes('forcibly closed'))
  );
}

/**
 * Retries a function with exponential backoff for transient connection errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (error: unknown, attempt: number) => Promise<void>,
  maxRetries: number = 2,
  baseDelay: number = 100,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry transient connection errors
      if (!isTransientConnectionError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Call onRetry callback if provided (for disconnect/reconnect logic)
      if (onRetry) {
        await onRetry(error, attempt);
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Context for retry operations
 */
export interface RetryContext {
  op: string;
  meta?: Record<string, any>;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly healthCheckIntervalMs = 30000; // 30 seconds
  private isReconnecting = false;
  private reconnectPromise: Promise<void> | null = null;
  private lastReconnectAt: number = 0;
  private readonly reconnectCooldownMs = 2000; // 2 seconds cooldown between reconnects

  constructor() {
    // Configure PrismaClient - connection pool settings come from DATABASE_URL parameters
    // Recommended DATABASE_URL format:
    // postgresql://user:pass@host/db?sslmode=require&connection_limit=10&pool_timeout=20&connect_timeout=10
    // For Neon PostgreSQL, use pooled connection string with pgbouncer=true
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['warn', 'error'] 
        : ['error'],
      // Add error formatting for better debugging
      errorFormat: 'pretty',
    });

    // Set up middleware to retry transient connection errors with reconnection
    this.$use(async (params, next) => {
      try {
        return await withRetry(
          async () => {
            // Check if connection is alive before operation
            if (!this.isConnected) {
              try {
                await this.$connect();
                this.isConnected = true;
                this.logger.log('Reconnected to database');
              } catch (reconnectError) {
                this.logger.warn('Failed to reconnect, will retry operation');
              }
            }
            return await next(params);
          },
          async (_error, attempt) => {
            // On connection errors, force disconnect before retrying
            // This callback is only called for transient connection errors that will be retried
            this.logger.warn(
              `Connection error detected (attempt ${attempt + 1}/3), forcing disconnect and reconnect`,
            );
            this.isConnected = false;
            
            // Use shared reconnection to prevent multiple simultaneous reconnection attempts
            await this.safeReconnect();
            
            // Wait a bit before retrying (progressive delay)
            await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
          },
          3, // max 3 retries
          150, // base delay 150ms
        );
      } catch (error) {
        // If connection error, mark as disconnected and try to reconnect
        if (isTransientConnectionError(error)) {
          this.isConnected = false;
          
          // Try to reconnect for next operation (non-blocking)
          this.safeReconnect().catch((reconnectError) => {
            this.logger.warn('Could not reconnect after error', reconnectError);
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

          this.logger.error(
            `Database connection error (transient) - Operation: ${params.model}.${params.action}`,
            JSON.stringify(errorInfo),
          );
        }
        throw error;
      }
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connected successfully');
      
      // Start periodic health check to keep connection alive
      this.startHealthCheck();
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to database on startup', error);
      throw error;
    }
  }

  /**
   * Starts periodic health checks to detect and recover from connection issues
   */
  private startHealthCheck(): void {
    // Only run health checks in production or when explicitly enabled
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
        if (!this.isConnected) {
          this.isConnected = true;
          this.logger.log('Connection restored via health check');
        }
      } catch (error) {
        if (isTransientConnectionError(error)) {
          this.isConnected = false;
          this.logger.warn('Health check detected connection issue, attempting reconnect');
          try {
            await this.safeReconnect();
          } catch (reconnectError) {
            this.logger.warn('Failed to reconnect via health check');
          }
        }
      }
    }, this.healthCheckIntervalMs);
  }

  async onModuleDestroy() {
    // Stop health check interval
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

  /**
   * Health check method to verify database connectivity
   */
  async checkHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      this.isConnected = true;
      return { healthy: true, latency };
    } catch (error) {
      this.isConnected = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Database health check failed: ${errorMessage}`);
      
      // Try to reconnect
      try {
        await this.safeReconnect();
      } catch (reconnectError) {
        this.logger.warn('Could not reconnect during health check');
      }
      
      return { healthy: false, error: errorMessage.substring(0, 200) };
    }
  }

  /**
   * Ensures database connection is active, reconnects if needed
   */
  async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.safeReconnect();
    }
  }

  /**
   * Safe reconnect with mutex/lock and cooldown to prevent reconnect storms.
   * Only one reconnect happens at a time, and reconnects are rate-limited.
   */
  private async safeReconnect(): Promise<void> {
    // If already reconnecting, wait for the existing reconnection to complete
    if (this.isReconnecting && this.reconnectPromise) {
      return this.reconnectPromise;
    }

    // Enforce cooldown: don't reconnect if we just reconnected recently
    const timeSinceLastReconnect = Date.now() - this.lastReconnectAt;
    if (timeSinceLastReconnect < this.reconnectCooldownMs) {
      const waitTime = this.reconnectCooldownMs - timeSinceLastReconnect;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Start new reconnection
    this.isReconnecting = true;
    this.reconnectPromise = (async () => {
      try {
        // Force disconnect to clear stale connections (ignore errors)
        try {
          await this.$disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors - connection may already be closed
        }

        // Small delay before reconnecting
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Reconnect
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

  /**
   * Executes a Prisma operation with automatic retry for transient connection errors.
   * 
   * Features:
   * - Detects transient connection errors (ECONNRESET, 10054, P1001, P1002, etc.)
   * - Retries up to 3 times with exponential backoff + jitter
   * - Uses safe reconnect (mutex + cooldown) to prevent reconnect storms
   * - Returns 503 ServiceUnavailableException if all retries fail
   * - Improved logging (WARN on first error, INFO on reconnect, ERROR on exhaustion)
   * 
   * @param fn The Prisma operation to execute
   * @param ctx Context with operation name and optional metadata
   * @returns The result of the Prisma operation
   * @throws ServiceUnavailableException if all retries are exhausted
   */
  async prismaWithRetry<T>(fn: () => Promise<T>, ctx: RetryContext): Promise<T> {
    const { op, meta } = ctx;
    let lastError: unknown;
    let firstErrorLogged = false;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Check if error is transient
        if (!isTransientConnectionError(error)) {
          // Non-transient error: rethrow immediately (no retry)
          throw error;
        }

        // Transient error: log first occurrence
        if (!firstErrorLogged) {
          firstErrorLogged = true;
          const errorCode = this.extractErrorCode(error);
          const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
          this.logger.warn(
            `Transient DB error in ${op} (attempt ${attempt + 1}/3) | Code: ${errorCode}${metaStr}`,
          );
        }

        // Don't retry on last attempt
        if (attempt === 2) {
          break;
        }

        // Trigger safe reconnect (with mutex and cooldown)
        try {
          await this.safeReconnect();
        } catch (reconnectError) {
          // Reconnect failed, but we'll still retry the operation
          this.logger.warn(`Reconnect attempt failed for ${op}, will retry operation`);
        }

        // Exponential backoff with jitter: 150ms, 300ms, 600ms + random 0-100ms
        const baseDelay = 150 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 100);
        const delay = baseDelay + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted: log error and throw 503
    const errorCode = this.extractErrorCode(lastError);
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    this.logger.error(
      `DB connection exhausted for ${op} after 3 attempts | Code: ${errorCode}${metaStr}`,
    );

    throw new ServiceUnavailableException(
      'Database connection temporarily unavailable. Please retry.',
    );
  }

  /**
   * Extracts a short error code/identifier from an error for logging
   */
  private extractErrorCode(error: unknown): string {
    if (!error || typeof error !== 'object') return 'UNKNOWN';

    const err = error as any;

    // Prisma error codes
    if (err.code && typeof err.code === 'string') {
      return err.code;
    }

    // Node/OS error codes
    if (err.code) {
      return String(err.code);
    }

    // Check cause
    if (err.cause?.code) {
      return String(err.cause.code);
    }

    // Check message for common patterns
    const message = String(err.message || '').toLowerCase();
    if (message.includes('10054')) return '10054';
    if (message.includes('econnreset')) return 'ECONNRESET';
    if (message.includes('etimedout')) return 'ETIMEDOUT';
    if (message.includes('epipe')) return 'EPIPE';
    if (message.includes('connection reset')) return 'CONNECTION_RESET';
    if (message.includes('server has closed')) return 'SERVER_CLOSED';

    return 'UNKNOWN';
  }
}
