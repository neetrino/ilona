import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';

@Injectable()
export class StudentStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(id: string, currentUserId?: string, userRole?: UserRole) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        group: {
          select: { centerId: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    if (userRole === UserRole.MANAGER && currentUserId) {
      const managerProfile = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
        SELECT "centerId" FROM "manager_profiles" WHERE "userId" = ${currentUserId} LIMIT 1
      `;

      const managerCenterId = managerProfile[0]?.centerId;
      if (!managerCenterId) {
        throw new ForbiddenException('Manager account is not assigned to a center');
      }

      if (student.group?.centerId !== managerCenterId) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    // Get attendance stats
    const totalAttendances = await this.prisma.attendance.count({
      where: { studentId: id },
    });

    const presentCount = await this.prisma.attendance.count({
      where: { studentId: id, isPresent: true },
    });

    const unjustifiedAbsences = await this.prisma.attendance.count({
      where: { studentId: id, isPresent: false, absenceType: 'UNJUSTIFIED' },
    });

    // Get payments stats
    const pendingPayments = await this.prisma.payment.count({
      where: { studentId: id, status: 'PENDING' },
    });

    const overduePayments = await this.prisma.payment.count({
      where: { studentId: id, status: 'OVERDUE' },
    });

    // Get feedbacks count
    const feedbacksCount = await this.prisma.feedback.count({
      where: { studentId: id },
    });

    return {
      attendance: {
        total: totalAttendances,
        present: presentCount,
        absent: totalAttendances - presentCount,
        unjustifiedAbsences,
        rate: totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0,
      },
      payments: {
        pending: pendingPayments,
        overdue: overduePayments,
      },
      feedbacks: feedbacksCount,
    };
  }

  async getMyDashboard(userId: string): Promise<unknown> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        group: {
          select: { id: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    if (!student.groupId) {
      return {
        student,
        upcomingLessons: [],
        recentFeedbacks: [],
        pendingPayments: [],
        statistics: await this.getStatistics(student.id),
      };
    }

    // Get upcoming lessons
    const upcomingLessons = await this.prisma.lesson.findMany({
      where: {
        groupId: student.groupId,
        scheduledAt: { gte: new Date() },
        status: 'SCHEDULED',
      },
      take: 5,
      orderBy: { scheduledAt: 'asc' },
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Get recent feedbacks
    const recentFeedbacks = await this.prisma.feedback.findMany({
      where: { studentId: student.id },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: { select: { scheduledAt: true, topic: true } },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Get payment status: one entry per calendar month (avoid duplicate months)
    const pendingRows = await this.prisma.payment.findMany({
      where: { studentId: student.id, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
    });
    const byMonth = new Map<string, { id: string; amount: number; dueDate: Date; status: string }[]>();
    for (const p of pendingRows) {
      const m = p.month;
      const key = `${m.getUTCFullYear()}-${m.getUTCMonth()}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push({
        id: p.id,
        amount: Number(p.amount),
        dueDate: p.dueDate,
        status: p.status,
      });
    }
    const pendingPayments = Array.from(byMonth.values()).map((list) => {
      const amount = list.reduce((s, x) => s + x.amount, 0);
      const first = list[0];
      const status = list.some((x) => x.status === 'OVERDUE') ? 'OVERDUE' : 'PENDING';
      return { id: first.id, amount, dueDate: first.dueDate, status };
    });

    // Get attendance statistics
    const stats = await this.getStatistics(student.id);

    return {
      student,
      upcomingLessons,
      recentFeedbacks,
      pendingPayments,
      statistics: stats,
    };
  }
}

