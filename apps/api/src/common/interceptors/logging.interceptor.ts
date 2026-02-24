import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, path } = request;
    const correlationId = request.correlationId;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          this.logger.log(
            JSON.stringify({
              message: 'request_completed',
              method,
              path: path || url,
              statusCode,
              durationMs,
              correlationId,
            }),
          );
        },
        error: (err) => {
          const durationMs = Date.now() - startTime;
          const statusCode = err.status || err.statusCode || 500;
          this.logger.warn(
            JSON.stringify({
              message: 'request_failed',
              method,
              path: path || url,
              statusCode,
              durationMs,
              correlationId,
              error: err.message,
            }),
          );
        },
      }),
    );
  }
}
