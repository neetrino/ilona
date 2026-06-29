import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceScopeService {
  constructor(private readonly prisma: PrismaService) {}
  async getManagerCenterId(userId?: string, userRole?: UserRole): Promise<string | null> {
    if (userRole !== UserRole.MANAGER || !userId) {
      return null;
    }

    const managerProfile = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
      SELECT "centerId" FROM "manager_profiles"
      WHERE "userId" = ${userId} AND "isCurrentAssignment" = true
      LIMIT 1
    `;

    const managerCenterId = managerProfile[0]?.centerId;
    if (!managerCenterId) {
      throw new ForbiddenException('Manager account is not assigned to a center');
    }

    return managerCenterId;
  }
}
