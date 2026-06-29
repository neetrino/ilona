import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { GroupScheduleLessonsService } from './group-schedule-lessons.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
import { teacherActsAsLessonInstructor } from '../../common/lesson-instructor';

@Injectable()
export class LessonDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupScheduleLessonsService: GroupScheduleLessonsService,
    private readonly managerAccessService: LessonManagerAccessService,
  ) {}

  async delete(id: string) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id },
      select: { groupId: true, scheduledAt: true, creationSource: true },
    });
    if (!existing) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    const deleted = await this.prisma.lesson.delete({
      where: { id },
    });
    await this.groupScheduleLessonsService.recordSuppressedSlotAfterLessonDeletion({
      groupId: existing.groupId,
      scheduledAt: existing.scheduledAt,
      creationSource: existing.creationSource,
    });
    return deleted;
  }

  async deleteBulk(lessonIds: string[], currentUserId?: string, userRole?: UserRole) {
    if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw new BadRequestException('lessonIds must be a non-empty array');
    }

    let currentTeacherId: string | null = null;
    if (userRole === UserRole.TEACHER && currentUserId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: currentUserId },
        select: { id: true },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      currentTeacherId = teacher.id;

      const lessons = await this.prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
        },
        select: {
          id: true,
          teacherId: true,
          substituteTeacherId: true,
          status: true,
        },
      });

      const foundIds = new Set(lessons.map((l) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`Lessons not found: ${missingIds.join(', ')}`);
      }

      const unauthorizedLessons = lessons.filter(
        (l) => !teacherActsAsLessonInstructor(l, currentTeacherId!),
      );
      if (unauthorizedLessons.length > 0) {
        throw new ForbiddenException(
          `You don't have permission to delete ${unauthorizedLessons.length} lesson(s)`,
        );
      }
    } else if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      const managerCenterId =
        userRole === UserRole.MANAGER
          ? await this.managerAccessService.getManagerCenterId(currentUserId, userRole)
          : null;

      const lessons = await this.prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
          ...(managerCenterId
            ? {
                group: {
                  centerId: managerCenterId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

      const foundIds = new Set(lessons.map((l) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`Lessons not found: ${missingIds.join(', ')}`);
      }
    } else {
      throw new ForbiddenException('You do not have permission to delete lessons');
    }

    const result = await this.prisma.lesson.deleteMany({
      where: {
        id: { in: lessonIds },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  }
}
