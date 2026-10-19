import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { NotificationEventsService } from '../notifications/notification-events.service';
import { assertManagerCanAccessCenter } from '../notifications/parent-report.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyPlanCommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationEventsService,
  ) {}

  async list(planId: string, user: JwtPayload) {
    await this.requirePlan(planId, user);
    const comments = await this.prisma.dailyPlanComment.findMany({
      where: { dailyPlanId: planId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
    return comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      authorName: `${comment.author.firstName} ${comment.author.lastName}`.trim(),
      authorRole: comment.author.role,
    }));
  }

  async create(planId: string, body: string, user: JwtPayload) {
    const plan = await this.requirePlan(planId, user);
    if (user.role === UserRole.TEACHER) {
      throw new ForbiddenException('Only a manager or admin can comment on a daily plan');
    }
    const author = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { firstName: true, lastName: true },
    });
    const comment = await this.prisma.dailyPlanComment.create({
      data: { dailyPlanId: planId, authorUserId: user.sub, body: body.trim() },
      select: { id: true },
    });
    const authorName = author ? `${author.firstName} ${author.lastName}`.trim() : 'Manager';
    await this.notifications.runSafe('lesson-plan-comment', () =>
      this.notifications.notifyLessonPlanComment({
        commentId: comment.id,
        planId,
        teacherUserId: plan.teacher.userId,
        authorUserId: user.sub,
        authorName,
        excerpt: body.trim(),
        groupName: plan.group?.name ?? null,
      }),
    );
    return this.list(planId, user);
  }

  private async requirePlan(planId: string, user: JwtPayload) {
    const plan = await this.prisma.dailyPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        group: { select: { name: true, centerId: true } },
        teacher: {
          select: {
            userId: true,
            centerLinks: { select: { centerId: true } },
          },
        },
      },
    });
    if (!plan) {
      throw new NotFoundException('Daily plan not found');
    }
    const managerCenterId = getManagerCenterIdOrThrow(user);
    assertManagerCanAccessCenter(managerCenterId, [
      plan.group?.centerId,
      ...plan.teacher.centerLinks.map((link) => link.centerId),
    ]);
    return plan;
  }
}
