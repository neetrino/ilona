import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { leadInclude } from './lead-include.util';

@Injectable()
export class LeadReadService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, _userId?: string, user?: JwtPayload) {
    const lead = await this.prisma.crmLead.findUnique({
      where: { id },
      include: leadInclude(),
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (managerCenterId && lead.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lead');
    }
    const activities = lead.activities as Array<{
      id: string;
      actorUserId: string | null;
      type: string;
      payload: unknown;
      createdAt: Date;
    }>;
    const actorUserIds = [...new Set(activities.map((a) => a.actorUserId).filter(Boolean))] as string[];
    const actorUsers =
      actorUserIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: actorUserIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];
    const actorUserMap = Object.fromEntries(actorUsers.map((u) => [u.id, u]));
    const activitiesWithActor = activities.map((a) => ({
      ...a,
      actorUser: a.actorUserId ? (actorUserMap[a.actorUserId] ?? null) : null,
    }));
    return { ...lead, activities: activitiesWithActor };
  }
}
