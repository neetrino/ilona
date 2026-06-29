import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
import { teacherActsAsLessonInstructor } from '../../common/lesson-instructor';

@Injectable()
export class LessonReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichmentService: LessonEnrichmentService,
    private readonly managerAccessService: LessonManagerAccessService,
  ) {}

  async findById(id: string, currentUserId?: string, userRole?: UserRole) {
    const managerCenterId = await this.managerAccessService.getManagerCenterId(
      currentUserId,
      userRole,
    );
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            center: true,
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    status: true,
                  },
                },
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
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        substituteTeacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        attendances: {
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
        feedbacks: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        dailyPlan: {
          select: { id: true, createdAt: true },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (teacher) {
        if (!teacherActsAsLessonInstructor(lesson, teacher.id)) {
          throw new ForbiddenException('You do not have access to this lesson');
        }
      } else {
        throw new ForbiddenException('Teacher profile not found');
      }
    }

    if (userRole === UserRole.STUDENT && currentUserId) {
      const student = await this.prisma.student.findUnique({
        where: { userId: currentUserId },
        select: { groupId: true },
      });
      if (!student?.groupId) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
      if (lesson.groupId !== student.groupId) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    if (managerCenterId && lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lesson');
    }

    return this.enrichmentService.enrichLesson(lesson);
  }
}
