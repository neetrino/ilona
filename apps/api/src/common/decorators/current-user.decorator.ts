import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/auth.types';

/**
 * Decorator to get the current authenticated user from the request
 * @param data - Optional key to extract from the user object
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      return user;
    }

    return data ? user[data] : user;
  },
);
