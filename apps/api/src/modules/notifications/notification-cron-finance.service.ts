import { Injectable } from '@nestjs/common';
import { PaymentStatus, UserRole, UserStatus } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationRecipientsService } from './notification-recipients.service';
import { NotificationWriteService } from './notification-write.service';
import { isQuarterEnd, zonedDayRange } from './notification-cron.util';

@Injectable()
export class NotificationCronFinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly write: NotificationWriteService,
    private readonly recipients: NotificationRecipientsService,
  ) {}

  async sendOverduePayments(now = new Date()): Promise<number> {
    const overdue = await this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        dueDate: { lt: now },
      },
      include: {
        student: {
          select: {
            id: true,
            groupId: true,
            user: { select: { firstName: true, lastName: true } },
            group: { select: { id: true, name: true, centerId: true } },
          },
        },
      },
    });

    let created = 0;
    const unpaidByGroup = new Map<string, { centerId: string; name: string; count: number }>();

    for (const payment of overdue) {
      if (payment.status === PaymentStatus.PENDING) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.OVERDUE },
        });
      }
      const studentName = `${payment.student.user.firstName} ${payment.student.user.lastName}`;
      const centerId = payment.student.group?.centerId ?? null;
      const userIds = await this.recipients.findStaffUserIdsForCenter(centerId);
      created += await this.write.createForUsers({
        userIds,
        type: 'PAYMENT_OVERDUE',
        title: 'Overdue payment',
        content: `${studentName} has an overdue tuition payment.`,
        data: {
          paymentId: payment.id,
          studentId: payment.student.id,
          href: `/admin/students/${payment.student.id}`,
        },
        dedupeKey: payment.id,
      });

      const group = payment.student.group;
      if (group) {
        const current = unpaidByGroup.get(group.id) ?? {
          centerId: group.centerId,
          name: group.name,
          count: 0,
        };
        current.count += 1;
        unpaidByGroup.set(group.id, current);
      }
    }

    created += await this.sendUnpaidGroupDigests(unpaidByGroup, zonedDayRange(now).ymd);
    return created;
  }

  async sendQuarterlyReminders(now = new Date(), options?: { force?: boolean }): Promise<number> {
    const { ymd } = zonedDayRange(now);
    if (!options?.force && !isQuarterEnd(ymd)) {
      return 0;
    }
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.MANAGER] },
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });
    return this.write.createForUsers({
      userIds: staff.map((user) => user.id),
      type: 'QUARTERLY_REPORT_DEADLINE',
      title: 'Quarterly report deadline',
      content: 'The quarterly report submission deadline is today.',
      data: { href: '/admin/analytics' },
      dedupeKey: ymd,
    });
  }

  private async sendUnpaidGroupDigests(
    unpaidByGroup: Map<string, { centerId: string; name: string; count: number }>,
    ymd: string,
  ): Promise<number> {
    let created = 0;
    for (const [groupId, info] of unpaidByGroup) {
      const userIds = await this.recipients.findStaffUserIdsForCenter(info.centerId);
      created += await this.write.createForUsers({
        userIds,
        type: 'GROUP_UNPAID_TUITION',
        title: 'Unpaid tuition in group',
        content: `${info.name} has ${info.count} unpaid tuition payment(s).`,
        data: { groupId, href: `/admin/groups/view/${groupId}` },
        dedupeKey: `${groupId}:${ymd}`,
      });
    }
    return created;
  }
}
