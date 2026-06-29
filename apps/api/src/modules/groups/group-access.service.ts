import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

@Injectable()
export class GroupAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertManagerGroupAccess(groupId: string, user?: JwtPayload) {
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (!managerCenterId) return;

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, centerId: true },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    if (group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this group');
    }
  }
}
