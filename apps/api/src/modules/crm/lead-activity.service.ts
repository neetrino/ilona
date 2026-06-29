import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrmLeadActivityType, Prisma } from '@ilona/database';
import { AddCommentDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadReadService } from './lead-read.service';

@Injectable()
export class LeadActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readService: LeadReadService,
  ) {}

  async logActivity(
    leadId: string,
    actorUserId: string,
    type: CrmLeadActivityType,
    payload: Record<string, unknown>,
  ) {
    await this.prisma.crmLeadActivity.create({
      data: { leadId, actorUserId, type, payload: payload as Prisma.InputJsonValue },
    });
  }

  async getActivities(leadId: string, user?: JwtPayload) {
    await this.readService.findById(leadId, user?.sub, user);
    return this.prisma.crmLeadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(leadId: string, dto: AddCommentDto, actorUserId: string, user?: JwtPayload) {
    await this.readService.findById(leadId, actorUserId, user);
    await this.logActivity(leadId, actorUserId, 'COMMENT', { content: dto.content });
    return this.getActivities(leadId, user);
  }
}
