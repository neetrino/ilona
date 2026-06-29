import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma } from '@ilona/database';

@Injectable()
export class FeedbackQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getByLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        feedbacks: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const studentsWithFeedback = lesson.group.students.map((student) => {
      const feedback = lesson.feedbacks.find((f) => f.studentId === student.id);
      return {
        student: {
          id: student.id,
          user: student.user,
        },
        feedback: feedback || null,
      };
    });

    return {
      lesson: {
        id: lesson.id,
        scheduledAt: lesson.scheduledAt,
        topic: lesson.topic,
        status: lesson.status,
        notes: lesson.notes,
      },
      studentsWithFeedback,
    };
  }

  async getByStudent(
    studentId: string,
    userId: string,
    userRole: UserRole,
    params?: {
      dateFrom?: Date;
      dateTo?: Date;
      teacherId?: string;
    },
  ) {
    const where: Prisma.FeedbackWhereInput = { studentId };
    let teacherProfileId: string | null = null;

    if (userRole === UserRole.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      if (student.id !== studentId) {
        throw new ForbiddenException('You can only view your own feedback');
      }
    }

    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      teacherProfileId = teacher.id;
      where.teacherId = teacherProfileId;
    }

    if (params?.teacherId) {
      if (userRole === UserRole.TEACHER) {
        if (!teacherProfileId || teacherProfileId !== params.teacherId) {
          throw new ForbiddenException('You can only filter by your own teacher profile');
        }
      }
      where.teacherId = params.teacherId;
    }

    if (params?.dateFrom || params?.dateTo) {
      const scheduledAt: Prisma.DateTimeFilter = {};
      if (params.dateFrom) scheduledAt.gte = params.dateFrom;
      if (params.dateTo) scheduledAt.lte = params.dateTo;
      where.lesson = { is: { scheduledAt } };
    }

    return this.prisma.feedback.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            scheduledAt: true,
            absenceMarked: true,
            absenceMarkedAt: true,
            feedbacksCompleted: true,
            voiceSent: true,
            voiceSentAt: true,
            textSent: true,
            textSentAt: true,
            group: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ lesson: { scheduledAt: 'desc' } }, { createdAt: 'desc' }],
    });
  }
}
