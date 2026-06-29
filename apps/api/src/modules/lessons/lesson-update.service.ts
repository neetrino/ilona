import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLessonDto } from './dto';
import { UserRole, LessonStatus } from '@ilona/database';
import { LessonEnrichmentService } from './lesson-enrichment.service';
import { LessonReadService } from './lesson-read.service';
import { LessonManagerAccessService } from './lesson-manager-access.service';
import { SalariesService } from '../finance/salaries.service';
import { teacherActsAsLessonInstructor } from '../../common/lesson-instructor';

@Injectable()
export class LessonUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichmentService: LessonEnrichmentService,
    private readonly readService: LessonReadService,
    private readonly managerAccessService: LessonManagerAccessService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}

  async update(id: string, dto: UpdateLessonDto, userId?: string, userRole?: UserRole) {
    const lesson = await this.readService.findById(id, userId, userRole);

    if (userRole === UserRole.TEACHER && dto.substituteTeacherId !== undefined) {
      throw new ForbiddenException('Only administrators can assign substitute teachers');
    }

    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      if (!teacherActsAsLessonInstructor(lesson, teacher.id)) {
        throw new ForbiddenException('You can only edit your own lessons');
      }

      const originalScheduled = new Date(lesson.scheduledAt).getTime();
      if (originalScheduled < Date.now()) {
        const onlyMetadataChange =
          dto.scheduledAt === undefined && dto.duration === undefined;
        if (!onlyMetadataChange) {
          throw new ForbiddenException(
            'Past lessons are locked for teachers. Only an admin can reschedule them.',
          );
        }
      }
      if (dto.scheduledAt) {
        const next = new Date(dto.scheduledAt).getTime();
        if (!Number.isNaN(next) && next < Date.now()) {
          throw new ForbiddenException('Teachers cannot move a lesson to a past time.');
        }
      }
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(lesson.scheduledAt);
    const duration = dto.duration !== undefined ? dto.duration : lesson.duration;

    if (duration <= 0) {
      throw new BadRequestException('Duration must be greater than 0');
    }

    const endTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);
    if (endTime <= scheduledAt) {
      throw new BadRequestException('End time must be after start time');
    }

    if (lesson.status === 'COMPLETED') {
      if (dto.scheduledAt || dto.duration !== undefined) {
        throw new BadRequestException('Cannot change scheduledAt or duration for completed lesson');
      }
    }

    let nextSubstituteId: string | null | undefined;
    if (dto.substituteTeacherId !== undefined) {
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
        throw new ForbiddenException('Only administrators can assign substitute teachers');
      }
      const prevSub = lesson.substituteTeacherId ?? null;
      const raw = dto.substituteTeacherId;
      nextSubstituteId = raw === '' || raw === undefined ? null : raw;
      if (nextSubstituteId === lesson.teacherId) {
        throw new BadRequestException('Substitute teacher cannot be the same as the main teacher');
      }
      if (nextSubstituteId) {
        const sub = await this.prisma.teacher.findUnique({
          where: { id: nextSubstituteId },
          select: { id: true },
        });
        if (!sub) {
          throw new BadRequestException(`Substitute teacher with ID ${nextSubstituteId} not found`);
        }
      }
      if (nextSubstituteId !== prevSub) {
        const month = new Date(lesson.scheduledAt);
        const recalc = (tid: string) =>
          this.salariesService.recalculateSalaryForMonth(tid, month).catch(() => undefined);
        await Promise.all([
          recalc(lesson.teacherId),
          ...(prevSub ? [recalc(prevSub)] : []),
          ...(nextSubstituteId && nextSubstituteId !== prevSub ? [recalc(nextSubstituteId)] : []),
        ]);
      }
    }

    return this.prisma.lesson
      .update({
        where: { id },
        data: {
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
          duration: dto.duration,
          topic: dto.topic,
          description: dto.description,
          notes: dto.notes,
          ...(nextSubstituteId !== undefined ? { substituteTeacherId: nextSubstituteId } : {}),
        },
        include: {
          group: { select: { id: true, name: true, centerId: true } },
          teacher: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
          substituteTeacher: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
          dailyPlan: { select: { id: true } },
        },
      })
      .then((row) => this.enrichmentService.enrichLesson(row));
  }

  async setSubstituteForGroupDay(
    params: { groupId: string; date: string; substituteTeacherId: string | null },
    userId: string | undefined,
    userRole: UserRole | undefined,
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('Only administrators can assign substitute teachers');
    }

    const managerCenterId = await this.managerAccessService.getManagerCenterId(userId, userRole);
    const group = await this.prisma.group.findUnique({
      where: { id: params.groupId },
      select: { id: true, centerId: true, teacherId: true },
    });
    if (!group) {
      throw new BadRequestException(`Group with ID ${params.groupId} not found`);
    }
    if (managerCenterId && group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this group');
    }

    const dayStart = new Date(`${params.date}T00:00:00.000Z`);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('Invalid date. Use YYYY-MM-DD');
    }
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const nextSub: string | null =
      params.substituteTeacherId === '' || params.substituteTeacherId === undefined
        ? null
        : params.substituteTeacherId;

    if (!group.teacherId) {
      throw new BadRequestException('Group has no main teacher; assign a teacher to the group first');
    }
    if (nextSub === group.teacherId) {
      throw new BadRequestException('Substitute teacher cannot be the same as the main teacher');
    }
    if (nextSub) {
      const sub = await this.prisma.teacher.findUnique({
        where: { id: nextSub },
        select: { id: true },
      });
      if (!sub) {
        throw new BadRequestException(`Substitute teacher with ID ${nextSub} not found`);
      }
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        groupId: params.groupId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { not: LessonStatus.CANCELLED },
      },
      select: { id: true, teacherId: true, substituteTeacherId: true, scheduledAt: true },
    });

    if (nextSub && lessons.some((l) => l.teacherId === nextSub)) {
      throw new BadRequestException('Substitute cannot be the main teacher for one of these lessons');
    }

    const recalcPairs = new Map<string, { teacherId: string; month: Date }>();
    const addRecalc = (teacherId: string, scheduledAt: Date) => {
      const month = new Date(Date.UTC(scheduledAt.getUTCFullYear(), scheduledAt.getUTCMonth(), 1));
      const key = `${teacherId}|${month.toISOString()}`;
      recalcPairs.set(key, { teacherId, month });
    };

    for (const l of lessons) {
      const prevSub = l.substituteTeacherId ?? null;
      if (nextSub !== prevSub) {
        addRecalc(l.teacherId, l.scheduledAt);
        if (prevSub) addRecalc(prevSub, l.scheduledAt);
        if (nextSub) addRecalc(nextSub, l.scheduledAt);
      }
    }

    await this.prisma.lesson.updateMany({
      where: {
        groupId: params.groupId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { not: LessonStatus.CANCELLED },
      },
      data: { substituteTeacherId: nextSub },
    });

    await Promise.all(
      [...recalcPairs.values()].map(({ teacherId, month }) =>
        this.salariesService.recalculateSalaryForMonth(teacherId, month).catch(() => undefined),
      ),
    );

    return { updatedCount: lessons.length, lessonIds: lessons.map((l) => l.id) };
  }
}
