import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
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
      message.includes('os code 10054')
    );
  }

  // Check for generic connection errors (including Windows error 10054)
  const message = error.message.toLowerCase();
  
  if (!isConnectionError(error)) {
    return (
      message.includes('econnreset') ||
      message.includes('connection reset') ||
      message.includes('server has closed the connection') ||
      message.includes('connection closed') ||
      message.includes('socket hang up') ||
      message.includes('io(connectionreset') ||
      message.includes('os code 10054') ||
      error.name === 'ConnectionReset'
    );
  }
  
  return (
    message.includes('econnreset') ||
    message.includes('connection reset') ||
    message.includes('server has closed the connection') ||
    message.includes('connection closed') ||
    message.includes('socket hang up') ||
    message.includes('io(connectionreset') ||
    message.includes('os code 10054') ||
    error.name === 'ConnectionReset' ||
    error.code === 'ECONNRESET' ||
    error.code === 10054 || // Windows connection reset code
    (error.cause?.code === 'ECONNRESET') ||
    (error.cause?.code === 10054) ||
    Boolean(error.cause?.message && error.cause.message.toLowerCase().includes('connectionreset'))
  );
}

/**
 * Retries a function with exponential backoff for transient connection errors.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
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

      // Exponential backoff: 100ms, 200ms
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    // Configure PrismaClient - connection pool settings come from DATABASE_URL parameters
    // Recommended DATABASE_URL format:
    // postgresql://user:pass@host/db?sslmode=require&connection_limit=10&pool_timeout=20&connect_timeout=10
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['warn', 'error'] 
        : ['error'],
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
          3, // max 3 retries (increased from 2)
          150, // base delay 150ms (increased from 100ms)
        );
      } catch (error) {
        // If connection error, mark as disconnected and try to reconnect
        if (isTransientConnectionError(error)) {
          this.isConnected = false;
          
          // Try to reconnect for next operation
          try {
            await this.$connect();
            this.isConnected = true;
            this.logger.log('Reconnected to database after error');
          } catch (reconnectError) {
            this.logger.warn('Could not reconnect after error');
          }

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
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to database on startup', error);
      throw error;
    }
  }

  async onModuleDestroy() {
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
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Reconnected during health check');
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
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Reconnected to database');
      } catch (error) {
        this.isConnected = false;
        this.logger.error('Failed to ensure database connection', error);
        throw error;
      }
    }
  }
}
