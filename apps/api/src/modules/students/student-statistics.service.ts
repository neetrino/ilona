import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class StudentStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(id: string, _currentUserId?: string, _userRole?: UserRole) {
    // Verify student exists and check authorization (delegate to crud service)
    // For now, we'll just check existence
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
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

  async getMyDashboard(userId: string) {
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

    // Get payment status
    const pendingPayments = await this.prisma.payment.findMany({
      where: { studentId: student.id, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
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

