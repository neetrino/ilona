import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../types/auth.types';

/**
 * Returns the only centerId available for a manager.
 * Throws when manager has no center binding.
 */
export function getManagerCenterIdOrThrow(user: JwtPayload | undefined): string | undefined {
  if (!user || user.role !== UserRole.MANAGER) {
    return undefined;
  }

  const centerId = user.managerCenterId ?? null;
  if (!centerId) {
    throw new ForbiddenException('Manager account is not assigned to a center');
  }

  return centerId;
}

/**
 * Ensures manager cannot query or mutate outside own center.
 */
export function assertManagerCenterAccess(
  user: JwtPayload | undefined,
  requestedCenterId: string | undefined | null,
): string | undefined {
  const managerCenterId = getManagerCenterIdOrThrow(user);
  if (!managerCenterId) {
    return requestedCenterId ?? undefined;
  }

  if (requestedCenterId && requestedCenterId !== managerCenterId) {
    throw new ForbiddenException('Access to another center is forbidden');
  }

  return managerCenterId;
}
