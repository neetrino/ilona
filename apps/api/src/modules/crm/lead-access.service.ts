import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import type { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

type CrmLeadWhereInput = Prisma.CrmLeadWhereInput;

@Injectable()
export class LeadAccessService {
  constructor(private readonly prisma: PrismaService) {}

  applyManagerScope(where: CrmLeadWhereInput, user?: JwtPayload): CrmLeadWhereInput {
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (!managerCenterId) {
      return where;
    }

    return {
      AND: [where, { centerId: managerCenterId }],
    };
  }

  requireAdminForCrmLeadVoice(user?: JwtPayload): void {
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can create CRM leads from voice or upload voice attachments.',
      );
    }
  }

  ensureAdminForVoiceRecordingsHistory(user?: JwtPayload): void {
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators may use this endpoint');
    }
  }

  ensureManagerCenterInput(centerId: string | undefined, user?: JwtPayload): string | undefined {
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (!managerCenterId) {
      return centerId;
    }

    if (centerId && centerId !== managerCenterId) {
      throw new ForbiddenException('Access to another center is forbidden');
    }

    return managerCenterId;
  }

  async assertManagerLeadTeacherInCenter(
    teacherId: string | undefined | null,
    user?: JwtPayload,
  ): Promise<void> {
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (!managerCenterId) {
      return;
    }
    const tid = teacherId && String(teacherId).trim() !== '' ? String(teacherId).trim() : '';
    if (!tid) {
      return;
    }
    const ok = await this.prisma.teacher.findFirst({
      where: {
        id: tid,
        OR: [
          { groups: { some: { centerId: managerCenterId } } },
          { centerLinks: { some: { centerId: managerCenterId } } },
        ],
      },
      select: { id: true },
    });
    if (!ok) {
      throw new ForbiddenException('You can only assign leads to teachers in your center');
    }
  }
}
