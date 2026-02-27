import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { JwtPayload } from '../../../common/types/auth.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Diagnostics: Check if Authorization header is present (dev only)
    if (process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest<Request>();
      const authHeader = request.headers?.authorization;
      const hasAuthHeader = !!authHeader;
      const isBearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
      
      this.logger.debug(`[JWT Guard] ${request.method} ${request.url}`, {
        hasAuthHeader,
        isBearer,
        headerLength: typeof authHeader === 'string' ? authHeader.length : 0,
      });
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = JwtPayload>(
    err: Error | null,
    user: JwtPayload | false,
    info: { message?: string } | null,
    context: ExecutionContext,
  ): TUser {
    // Diagnostics logging (dev only)
    if (process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest<Request>();
      if (err || !user) {
        this.logger.warn(`[JWT Guard] Auth failed for ${request.method} ${request.url}`, {
          hasError: !!err,
          errorMessage: err?.message,
          hasInfo: !!info,
          infoMessage: info?.message,
          hasUser: !!user,
        });
      }
    }

    return super.handleRequest(err, user, info, context);
  }
}


