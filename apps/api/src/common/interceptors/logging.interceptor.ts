import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestContextService } from '../request-context/request-context.service';

interface HttpLikeError {
  status?: number;
  statusCode?: number;
  message?: string;
}

/** Query param keys that are safe to log (no tokens/passwords). */
const SAFE_QUERY_KEYS = new Set([
  'page', 'take', 'skip', 'sortBy', 'sortOrder', 'search', 'q', 'status',
  'role', 'dateFrom', 'dateTo', 'groupId', 'centerId', 'teacherId', 'id',
]);

function sanitizeQuery(params: Record<string, unknown> | undefined): Record<string, string> {
  if (!params || typeof params !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (SAFE_QUERY_KEYS.has(k) && v != null) {
      const s = String(v);
      out[k] = s.length > 100 ? s.slice(0, 100) + '…' : s;
    }
  }
  return out;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, path } = request;
    const route = path || url;
    const startTime = Date.now();

    const logSummary = (statusCode: number, errorMessage?: string) => {
      const s = this.requestContext.getStore();
      if (s && request.user && typeof request.user === 'object') {
        const user = request.user as { sub?: string; role?: string };
        s.userId = user.sub;
        s.role = user.role;
      }
      const durationMs = Date.now() - startTime;
      const store = this.requestContext.getStore();
      const payload: Record<string, unknown> = {
        message: 'request_summary',
        ts: new Date().toISOString(),
        requestId: request.correlationId,
        route,
        method,
        status: statusCode,
        durationMs,
        dbQueryCount: store?.dbQueryCount ?? 0,
        dbTimeMs: store?.dbTimeMs ?? 0,
        userId: store?.userId,
        role: store?.role,
      };
      const querySanitized = sanitizeQuery(request.query as Record<string, unknown>);
      if (Object.keys(querySanitized).length > 0) {
        payload.query = querySanitized;
      }
      if (errorMessage) payload.error = errorMessage;
      this.logger.log(JSON.stringify(payload));
    };

    return next.handle().pipe(
      tap({
        next: () => {
          logSummary(res.statusCode);
        },
        error: (err: HttpLikeError) => {
          logSummary(err.status ?? err.statusCode ?? 500, err.message);
        },
      }),
    );
  }
}
