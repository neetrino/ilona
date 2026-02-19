import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeacherStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(id: string, dateFrom?: Date, dateTo?: Date) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      select: { id: true, _count: { select: { groups: true } } },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    const lessonWhere: Prisma.LessonWhereInput = { teacherId: id };
    if (dateFrom || dateTo) {
      lessonWhere.scheduledAt = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    // Lesson statistics
    const [totalLessons, completedLessons, cancelledLessons] = await Promise.all([
      this.prisma.lesson.count({ where: lessonWhere }),
      this.prisma.lesson.count({ where: { ...lessonWhere, status: 'COMPLETED' } }),
      this.prisma.lesson.count({ where: { ...lessonWhere, status: 'CANCELLED' } }),
    ]);

    // Vocabulary compliance
    const lessonsWithVocab = await this.prisma.lesson.count({
      where: { ...lessonWhere, status: 'COMPLETED', vocabularySent: true },
    });

    // Feedback compliance
    const feedbacksRequired = await this.prisma.lesson.count({
      where: { ...lessonWhere, status: 'COMPLETED' },
    });

    const feedbacksProvided = await this.prisma.feedback.count({
      where: {
        teacherId: id,
        lesson: lessonWhere,
      },
    });

    // Deductions
    const deductions = await this.prisma.deduction.aggregate({
      where: { teacherId: id },
      _sum: { amount: true },
      _count: true,
    });

    // Students count
    const studentsCount = await this.prisma.student.count({
      where: { group: { teacherId: id } },
    });

    return {
      lessons: {
        total: totalLessons,
        completed: completedLessons,
        cancelled: cancelledLessons,
        scheduled: totalLessons - completedLessons - cancelledLessons,
      },
      compliance: {
        vocabularyRate: completedLessons > 0 
          ? Math.round((lessonsWithVocab / completedLessons) * 100) 
          : 0,
        feedbackRate: feedbacksRequired > 0 
          ? Math.round((feedbacksProvided / feedbacksRequired) * 100) 
          : 0,
      },
      deductions: {
        count: deductions._count,
        total: deductions._sum.amount || 0,
      },
      studentsCount,
      groupsCount: teacher._count.groups,
    };
  }

  async getMyDashboard(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    // Today's lessons
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        scheduledAt: { gte: today, lt: tomorrow },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: { select: { students: true } },
          },
        },
        _count: { select: { attendances: true, feedbacks: true } },
      },
    });

    // Upcoming lessons
    const upcomingLessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        scheduledAt: { gte: tomorrow },
        status: 'SCHEDULED',
      },
      take: 5,
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    // Pending tasks (lessons without feedback/vocabulary)
    const pendingFeedback = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: 'COMPLETED',
        feedbacksCompleted: false,
      },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    const pendingVocabulary = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: 'COMPLETED',
        vocabularySent: false,
      },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    // Recent deductions
    const recentDeductions = await this.prisma.deduction.findMany({
      where: { teacherId: teacher.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Statistics
    const stats = await this.getStatistics(teacher.id);

    return {
      teacher,
      todayLessons,
      upcomingLessons,
      pendingTasks: {
        feedback: pendingFeedback,
        vocabulary: pendingVocabulary,
      },
      recentDeductions,
      statistics: stats,
    };
  }

  async getDailyPlan(userId: string, date: Date) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        group: {
          include: {
            center: { select: { id: true, name: true } },
            students: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
          },
        },
        attendances: true,
        feedbacks: true,
      },
    });

    return {
      date,
      teacher: {
        id: teacher.id,
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
      },
      lessons: lessons.map((lesson: typeof lessons[0]) => ({
        ...lesson,
        attendanceStatus: {
          total: lesson.group.students.length,
          marked: lesson.attendances.length,
        },
        feedbackStatus: {
          total: lesson.group.students.length,
          completed: lesson.feedbacks.length,
        },
      })),
    };
  }
}

