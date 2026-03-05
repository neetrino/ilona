import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@ilona/database';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access an endpoint
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
