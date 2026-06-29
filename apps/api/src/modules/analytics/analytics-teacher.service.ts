import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { lessonsPayableToTeacherWhere } from '../../common/lesson-instructor';
import { subMonths } from './analytics.util';

@Injectable()
export class AnalyticsTeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeacherPerformance(dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || subMonths(new Date(), 1);
    const to = dateTo || new Date();

    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            groups: true,
          },
        },
      },
    });

    const performance = await Promise.all(
      teachers.map(async (teacher) => {
        const lessons = await this.prisma.lesson.findMany({
          where: {
            ...lessonsPayableToTeacherWhere(teacher.id),
            scheduledAt: { gte: from, lte: to },
          },
          include: {
            _count: {
              select: { attendances: true },
            },
          },
        });

        const completedLessons = lessons.filter((l) => l.status === 'COMPLETED').length;
        const totalLessons = lessons.length;
        const vocabularySent = lessons.filter((l) => l.vocabularySent).length;
        const feedbacksDone = lessons.filter((l) => l.feedbacksCompleted).length;
        const voiceSent = lessons.filter((l) => l.voiceSent).length;
        const textSent = lessons.filter((l) => l.textSent).length;
        const absenceMarkedCount = lessons.filter((l) => l.absenceMarked).length;

        const deductions = await this.prisma.deduction.aggregate({
          where: {
            teacherId: teacher.id,
            createdAt: { gte: from, lte: to },
          },
          _sum: { amount: true },
          _count: true,
        });

        const salary = await this.prisma.salaryRecord.aggregate({
          where: {
            teacherId: teacher.id,
            status: 'PAID',
            paidAt: { gte: from, lte: to },
          },
          _sum: { netAmount: true },
        });

        return {
          id: teacher.id,
          name: `${teacher.user.firstName} ${teacher.user.lastName}`,
          email: teacher.user.email,
          totalLessons,
          completedLessons,
          completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          vocabularySentRate: completedLessons > 0 ? Math.round((vocabularySent / completedLessons) * 100) : 0,
          feedbacksRate: completedLessons > 0 ? Math.round((feedbacksDone / completedLessons) * 100) : 0,
          voiceRate: completedLessons > 0 ? Math.round((voiceSent / completedLessons) * 100) : 0,
          textRate: completedLessons > 0 ? Math.round((textSent / completedLessons) * 100) : 0,
          absenceMarkedRate:
            completedLessons > 0
              ? Math.round((absenceMarkedCount / completedLessons) * 100)
              : 0,
          groupsCount: teacher._count.groups,
          deductionsCount: deductions._count,
          deductionsAmount: Number(deductions._sum.amount) || 0,
          salaryEarned: Number(salary._sum?.netAmount) || 0,
        };
      }),
    );

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  }
}
