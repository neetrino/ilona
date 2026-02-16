import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { parseCookies } from '../../../common/utils/cookie.util';

/**
 * Guard that checks if the user has unlocked analytics with a password
 * This guard should be used AFTER RolesGuard to ensure user is ADMIN
 */
@Injectable()
export class AnalyticsUnlockGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { cookie?: string };
      user?: { role: string };
    }>();

    // First check: User must be ADMIN (this should already be checked by RolesGuard, but double-check)
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can access analytics');
    }

    // Second check: Must have valid unlock cookie
    const cookieHeader = request.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    const unlockCookie = cookies['analytics_unlock'];

    // Check if cookie exists and is valid (value should be 'true' or a signed value)
    if (!unlockCookie || unlockCookie !== 'true') {
      throw new ForbiddenException('Analytics access requires password unlock');
    }

    return true;
  }
}
