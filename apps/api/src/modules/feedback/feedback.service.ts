import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto';
import { UserRole } from '@prisma/client';
import { SalariesService } from '../finance/salaries.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}

  /**
   * Get feedback by lesson ID
   */
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

    // Map students with their feedback
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
        notes: lesson.notes, // General feedback
      },
      studentsWithFeedback,
    };
  }

  /**
   * Get feedback by student ID
   */
  async getByStudent(studentId: string, params?: { dateFrom?: Date; dateTo?: Date }) {
    const where: any = { studentId };
    
    if (params?.dateFrom || params?.dateTo) {
      where.lesson = {};
      if (params.dateFrom) where.lesson.scheduledAt = { ...where.lesson.scheduledAt, gte: params.dateFrom };
      if (params.dateTo) where.lesson.scheduledAt = { ...where.lesson.scheduledAt, lte: params.dateTo };
    }

    const feedbacks = await this.prisma.feedback.findMany({
      where,
      include: {
        lesson: {
          include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return feedbacks;
  }

  /**
   * Create or update feedback for a student in a lesson
   */
  async createOrUpdate(
    dto: CreateFeedbackDto,
    userId: string,
    userRole: UserRole,
  ) {
    // Verify lesson exists and get teacher info
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: {
        teacher: true,
        group: {
          include: {
            students: {
              where: { id: dto.studentId },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${dto.lessonId} not found`);
    }

    // Verify student is in the lesson's group
    if (lesson.group.students.length === 0) {
      throw new BadRequestException('Student is not in this lesson\'s group');
    }

    // Check permissions - only the teacher assigned to the lesson can create feedback
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== lesson.teacherId) {
        throw new ForbiddenException('You are not assigned to this lesson');
      }
    }

    // Check if feedback already exists
    const existingFeedback = await this.prisma.feedback.findUnique({
      where: {
        lessonId_studentId: {
          lessonId: dto.lessonId,
          studentId: dto.studentId,
        },
      },
    });

    if (existingFeedback) {
      // Update existing feedback
      const updatedFeedback = await this.prisma.feedback.update({
        where: { id: existingFeedback.id },
        data: {
          content: dto.content,
          rating: dto.rating,
          strengths: dto.strengths,
          improvements: dto.improvements,
        },
      });

      // Check if all students in the group have feedback
      const lessonWithGroup = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId },
        include: {
          group: {
            include: {
              students: true,
            },
          },
          feedbacks: true,
        },
      });

      if (lessonWithGroup) {
        const studentCount = lessonWithGroup.group.students.length;
        const feedbackCount = lessonWithGroup.feedbacks.length;
        
        // If all students have feedback, mark feedbacksCompleted as true
        if (studentCount > 0 && feedbackCount >= studentCount) {
          const wasAlreadyCompleted = lessonWithGroup.feedbacksCompleted;
          await this.prisma.lesson.update({
            where: { id: dto.lessonId },
            data: { feedbacksCompleted: true },
          });

          // Trigger salary recalculation if this is a new completion
          if (!wasAlreadyCompleted && lessonWithGroup.scheduledAt) {
            const lessonMonth = new Date(lessonWithGroup.scheduledAt);
            await this.salariesService.recalculateSalaryForMonth(
              lessonWithGroup.teacherId,
              lessonMonth,
            );
          }
        }
      }

      return updatedFeedback;
    }

    // Get teacher ID
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new ForbiddenException('Teacher not found');
    }

    // Create new feedback
    const newFeedback = await this.prisma.feedback.create({
      data: {
        lessonId: dto.lessonId,
        studentId: dto.studentId,
        teacherId: teacher.id,
        content: dto.content,
        rating: dto.rating,
        strengths: dto.strengths,
        improvements: dto.improvements,
      },
    });

    // Check if all students in the group have feedback
    const lessonWithGroup = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: {
        group: {
          include: {
            students: true,
          },
        },
        feedbacks: true,
      },
    });

    if (lessonWithGroup) {
      const studentCount = lessonWithGroup.group.students.length;
      const feedbackCount = lessonWithGroup.feedbacks.length;
      
      // If all students have feedback, mark feedbacksCompleted as true
      if (studentCount > 0 && feedbackCount >= studentCount) {
        const wasAlreadyCompleted = lessonWithGroup.feedbacksCompleted;
        await this.prisma.lesson.update({
          where: { id: dto.lessonId },
          data: { feedbacksCompleted: true },
        });

        // Trigger salary recalculation if this is a new completion
        if (!wasAlreadyCompleted && lessonWithGroup.scheduledAt) {
          const lessonMonth = new Date(lessonWithGroup.scheduledAt);
          await this.salariesService.recalculateSalaryForMonth(
            lessonWithGroup.teacherId,
            lessonMonth,
          );
        }
      }
    }

    return newFeedback;
  }

  /**
   * Update feedback
   */
  async update(
    id: string,
    dto: UpdateFeedbackDto,
    userId: string,
    userRole: UserRole,
  ) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            teacher: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    // Check permissions
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== feedback.teacherId) {
        throw new ForbiddenException('You can only edit your own feedback');
      }
    }

    return this.prisma.feedback.update({
      where: { id },
      data: {
        content: dto.content,
        rating: dto.rating,
        strengths: dto.strengths,
        improvements: dto.improvements,
      },
    });
  }

  /**
   * Delete feedback
   */
  async delete(id: string, userId: string, userRole: UserRole) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    // Check permissions
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== feedback.teacherId) {
        throw new ForbiddenException('You can only delete your own feedback');
      }
    }

    // Delete the feedback
    await this.prisma.feedback.delete({
      where: { id },
    });

    // Check if feedbacksCompleted should be set to false
    const lessonWithGroup = await this.prisma.lesson.findUnique({
      where: { id: feedback.lessonId },
      include: {
        group: {
          include: {
            students: true,
          },
        },
        feedbacks: true,
      },
    });

    if (lessonWithGroup) {
      const studentCount = lessonWithGroup.group.students.length;
      const feedbackCount = lessonWithGroup.feedbacks.length;
      const wasCompleted = lessonWithGroup.feedbacksCompleted;
      
      // If not all students have feedback, mark feedbacksCompleted as false
      if (studentCount > 0 && feedbackCount < studentCount) {
        await this.prisma.lesson.update({
          where: { id: feedback.lessonId },
          data: { feedbacksCompleted: false },
        });

        // Trigger salary recalculation if status changed from completed to incomplete
        if (wasCompleted && lessonWithGroup.scheduledAt) {
          const lessonMonth = new Date(lessonWithGroup.scheduledAt);
          await this.salariesService.recalculateSalaryForMonth(
            lessonWithGroup.teacherId,
            lessonMonth,
          );
        }
      }
    }

    return feedback;
  }
}

