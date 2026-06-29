import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto';
import { UserRole, LessonCreationSource } from '@ilona/database';
import { LessonManagerAccessService } from './lesson-manager-access.service';

@Injectable()
export class LessonCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly managerAccessService: LessonManagerAccessService,
  ) {}

  async create(dto: CreateLessonDto, currentUserId?: string, userRole?: UserRole) {
    const managerCenterId = await this.managerAccessService.getManagerCenterId(
      currentUserId,
      userRole,
    );

    if (userRole === UserRole.TEACHER && dto.scheduledAt) {
      const scheduled = new Date(dto.scheduledAt);
      if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() < Date.now()) {
        throw new ForbiddenException(
          'Teachers cannot create lessons in the past. Ask an admin to add it for you.',
        );
      }
    }

    const group = await this.prisma.group.findUnique({
      where: { id: dto.groupId },
    });

    if (!group) {
      throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
    }

    if (managerCenterId && group.centerId !== managerCenterId) {
      throw new ForbiddenException('You can only create lessons inside your center');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
    }

    return this.prisma.lesson.create({
      data: {
        groupId: dto.groupId,
        teacherId: dto.teacherId,
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration ?? 60,
        topic: dto.topic,
        description: dto.description,
        status: 'SCHEDULED',
        creationSource: dto.creationSource ?? LessonCreationSource.MANUAL,
      },
      include: {
        group: { select: { id: true, name: true } },
        teacher: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async createBulk(lessons: CreateLessonDto[], currentUserId?: string, userRole?: UserRole) {
    if (lessons.length === 0) {
      return [];
    }
    return Promise.all(lessons.map((dto) => this.create(dto, currentUserId, userRole)));
  }
}
