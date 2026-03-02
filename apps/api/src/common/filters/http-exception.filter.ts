import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

/**
 * Global exception filter. In production, responses must NOT include stack traces
 * or sensitive internal details (security requirement 3.2, 3.2a).
 * Uses ConfigService so NODE_ENV is read from the same source as the rest of the app (.env.local / env).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';

    let status: number;
    let message: string;
    let body: Record<string, unknown>;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && res !== null && 'message' in res
        ? (Array.isArray((res as { message: unknown }).message)
            ? (res as { message: string[] }).message.join(', ')
            : String((res as { message: string }).message))
        : exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = isProduction
        ? 'Internal server error'
        : (exception instanceof Error ? exception.message : 'Unknown error');
    }

    // Production: never expose stack or internal details in response
    if (isProduction) {
      body = {
        statusCode: status,
        message,
      };
    } else {
      body = {
        statusCode: status,
        message,
        ...(exception instanceof Error && exception.stack
          ? { stack: exception.stack }
          : {}),
      };
    }

    // Log server-side with full details (including stack) for debugging
    this.logger.warn(
      JSON.stringify({
        statusCode: status,
        path: request.url,
        method: request.method,
        message,
        ...(exception instanceof Error && exception.stack
          ? { stack: exception.stack }
          : {}),
      }),
    );

    response.status(status).json(body);
  }
}
