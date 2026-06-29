import { Prisma } from '@ilona/database';
import type { ConnectionError, ErrLike } from './prisma.types';

export function isConnectionError(error: unknown): error is ConnectionError {
  if (!(error instanceof Error)) return false;
  const err = error as Partial<ConnectionError>;
  return (
    typeof err.code !== 'undefined' ||
    typeof err.cause !== 'undefined' ||
    err.name === 'ConnectionReset'
  );
}

export function hasConnectionErrorCode(error: unknown, targetCode: string | number): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as ErrLike;

  if (err.code === targetCode || err.code === String(targetCode)) {
    return true;
  }

  if (err.cause?.code === targetCode || err.cause?.code === String(targetCode)) {
    return true;
  }

  if (err.cause && typeof err.cause === 'object') {
    const cause = err.cause;
    if (cause.code === targetCode || cause.code === String(targetCode)) {
      return true;
    }
    if (cause.cause?.code === targetCode || cause.cause?.code === String(targetCode)) {
      return true;
    }
  }

  const message = String(err.message ?? '').toLowerCase();
  if (message.includes(`code ${targetCode}`) || message.includes(`code: ${targetCode}`)) {
    return true;
  }

  return false;
}

export function isTransientConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const prismaConnectionErrorCodes = ['P1001', 'P1002', 'P1008', 'P1017'];

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return prismaConnectionErrorCodes.includes(error.code);
  }

  if (hasConnectionErrorCode(error, 10054) || hasConnectionErrorCode(error, '10054')) {
    return true;
  }

  const networkErrorCodes = ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED'];
  for (const code of networkErrorCodes) {
    if (hasConnectionErrorCode(error, code)) {
      return true;
    }
  }

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

  const message = error.message.toLowerCase();
  const err = error as ErrLike;

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
    err.cause?.code === 'ECONNRESET' ||
    err.cause?.code === 10054 ||
    err.cause?.code === '10054' ||
    Boolean(err.cause?.message && err.cause.message.toLowerCase().includes('connectionreset')) ||
    Boolean(err.cause?.message && err.cause.message.toLowerCase().includes('forcibly closed'))
  );
}

export async function withRetry<T>(
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

      if (!isTransientConnectionError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      if (onRetry) {
        await onRetry(error, attempt);
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function extractPrismaErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'UNKNOWN';

  const err = error as ErrLike;

  if (err.code && typeof err.code === 'string') {
    return err.code;
  }

  if (err.code !== undefined) {
    return String(err.code);
  }

  if (err.cause?.code !== undefined) {
    return String(err.cause.code);
  }

  const message = String(err.message ?? '').toLowerCase();
  if (message.includes('10054')) return '10054';
  if (message.includes('econnreset')) return 'ECONNRESET';
  if (message.includes('etimedout')) return 'ETIMEDOUT';
  if (message.includes('epipe')) return 'EPIPE';
  if (message.includes('connection reset')) return 'CONNECTION_RESET';
  if (message.includes('server has closed')) return 'SERVER_CLOSED';

  return 'UNKNOWN';
}
