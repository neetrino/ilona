import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if endpoint is public - if so, allow access
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload; method: string; url: string }>();
    const user = request.user;

    // If user is null, JWT auth failed (shouldn't happen if JwtAuthGuard ran first, but handle it)
    if (!user) {
      // Log for diagnostics (dev only)
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`RolesGuard: User is null for ${request.method} ${request.url} - JWT auth may have failed`);
      }
      throw new UnauthorizedException('Authentication required');
    }

    // Check if user has required role
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRequiredRole) {
      // Log for diagnostics (dev only)
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `RolesGuard: User ${user.email} (${user.role}) lacks required role(s) [${requiredRoles.join(', ')}] for ${request.method} ${request.url}`
        );
      }
      throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
