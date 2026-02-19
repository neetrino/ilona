import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteLessonDto } from './dto';
import { UserRole } from '@prisma/client';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonCrudService } from './lesson-crud.service';

/**
 * Service responsible for lesson status management
 */
@Injectable()
export class LessonStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichmentService: LessonEnrichmentService,
    private readonly crudService: LessonCrudService,
  ) {}

  async startLesson(id: string, userId: string, userRole: UserRole) {
    const lesson = await this.crudService.findById(id);

    // Check if teacher owns this lesson
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== lesson.teacherId) {
        throw new ForbiddenException('You are not assigned to this lesson');
      }
    }

    if (lesson.status !== 'SCHEDULED') {
      throw new BadRequestException('Lesson cannot be started');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async completeLesson(id: string, dto: CompleteLessonDto, userId: string, userRole: UserRole) {
    const lesson = await this.crudService.findById(id);

    // Check if teacher owns this lesson
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || teacher.id !== lesson.teacherId) {
        throw new ForbiddenException('You are not assigned to this lesson');
      }
    }

    // Allow completing lessons that are SCHEDULED, IN_PROGRESS, or past lessons (CANCELLED/MISSED)
    // This allows teachers/admins to mark past lessons as completed retroactively
    if (!['SCHEDULED', 'IN_PROGRESS', 'CANCELLED', 'MISSED'].includes(lesson.status)) {
      throw new BadRequestException('Lesson cannot be completed');
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: dto.notes,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            level: true,
            center: { select: { id: true, name: true } },
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
        _count: {
          select: {
            attendances: true,
            feedbacks: true,
          },
        },
      },
    });

    // Return enriched lesson with computed lock states
    return this.enrichmentService.enrichLesson(updated);
  }

  async cancelLesson(id: string, reason?: string) {
    const lesson = await this.crudService.findById(id);

    if (['COMPLETED', 'CANCELLED'].includes(lesson.status)) {
      throw new BadRequestException('Lesson cannot be cancelled');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
      },
    });
  }

  async markMissed(id: string) {
    const lesson = await this.crudService.findById(id);

    if (lesson.status !== 'SCHEDULED') {
      throw new BadRequestException('Only scheduled lessons can be marked as missed');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: { status: 'MISSED' },
    });
  }
}



