/**
 * Per-request store for instrumentation (logging, DB metrics).
 * Set in correlation middleware, updated by Prisma middleware and logging interceptor.
 */
export interface RequestContextStore {
  requestId: string;
  userId?: string;
  role?: string;
  dbQueryCount: number;
  dbTimeMs: number;
}
