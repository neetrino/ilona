import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from '../finance/salaries.service';
import {
  CreateDailyPlanDto,
  UpdateDailyPlanDto,
  QueryDailyPlanDto,
  DailyPlanTopicInputDto,
} from './dto';
import { DailyPlanResourceKind, Prisma, UserRole } from '@ilona/database';
import { effectiveLessonInstructorTeacherId, teacherActsAsLessonInstructor } from '../../common/lesson-instructor';
import { JwtPayload } from '../../common/types/auth.types';

const RESOURCE_KINDS = new Set<string>([
  DailyPlanResourceKind.READING,
  DailyPlanResourceKind.LISTENING,
  DailyPlanResourceKind.WRITING,
  DailyPlanResourceKind.SPEAKING,
]);

const dailyPlanInclude = {
  topics: {
    orderBy: { order: 'asc' as const },
    include: { resources: { orderBy: { kind: 'asc' as const } } },
  },
  group: {
    select: {
      id: true,
      name: true,
      level: true,
      centerId: true,
      center: { select: { id: true, name: true } },
    },
  },
  lesson: {
    select: {
      id: true,
      scheduledAt: true,
      group: {
        select: {
          id: true,
          name: true,
          centerId: true,
          center: { select: { id: true, name: true } },
        },
      },
    },
  },
  teacher: {
    select: {
      id: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.DailyPlanInclude;

type DailyPlanWithRelations = Prisma.DailyPlanGetPayload<{
  include: typeof dailyPlanInclude;
}>;

function normalizeTopics(topics: DailyPlanTopicInputDto[]): {
  title: string;
  order: number;
  resources: {
    create: {
      kind: DailyPlanResourceKind;
      title: string;
      link: string | null;
      description: string | null;
    }[];
  };
}[] {
  return topics.map((topic, idx) => ({
    title: topic.title.trim(),
    order: idx,
    resources: {
      create: topic.resources.map((res) => {
        if (!RESOURCE_KINDS.has(res.kind)) {
          throw new BadRequestException(`Unsupported resource kind: ${res.kind}`);
        }
        return {
          kind: res.kind as DailyPlanResourceKind,
          title: res.title.trim(),
          link: res.link?.trim() || null,
          description: res.description?.trim() || null,
        };
      }),
    },
  }));
}

@Injectable()
export class DailyPlanService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}

  private async triggerSalaryRecalculationForPlan(plan: {
    lessonId: string | null;
    teacherId: string;
    date: Date;
  }) {
    if (!plan.lessonId) {
      return;
    }
    await this.salariesService
      .recalculateSalaryForMonth(plan.teacherId, plan.date)
      .catch(() => {
        // Daily plan updates should not fail because salary recalculation failed.
      });
  }

  private async resolveTeacherId(userId: string): Promise<string> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) {
      throw new ForbiddenException('Teacher profile not found');
    }
    return teacher.id;
  }

  /** Same scope as TeacherCrudService for managers: group at center OR explicit teacher↔center link. */
  private managerTeacherAtCenterScope(
    managerCenterId: string,
  ): Prisma.TeacherWhereInput {
    return {
      OR: [
        { groups: { some: { centerId: managerCenterId } } },
        { centerLinks: { some: { centerId: managerCenterId } } },
      ],
    };
  }

  private canUserEditPlan(plan: DailyPlanWithRelations, user: JwtPayload): boolean {
    return plan.teacher.user.id === user.sub;
  }

  private serializePlan(plan: DailyPlanWithRelations, user: JwtPayload) {
    return {
      ...plan,
      canEdit: this.canUserEditPlan(plan, user),
    };
  }

  private async assertPlanViewAccess(
    plan: DailyPlanWithRelations,
    user: JwtPayload,
  ): Promise<void> {
    if (user.role !== UserRole.MANAGER) {
      return;
    }

    const managerCenterId = user.managerCenterId ?? null;
    if (!managerCenterId) {
      throw new ForbiddenException('Manager account is not assigned to a center');
    }

    const teacherInCenter = await this.prisma.teacher.findFirst({
      where: {
        id: plan.teacherId,
        ...this.managerTeacherAtCenterScope(managerCenterId),
      },
      select: { id: true },
    });
    if (!teacherInCenter) {
      throw new ForbiddenException('Access denied');
    }

    const inCenter =
      plan.group?.centerId === managerCenterId ||
      plan.lesson?.group?.centerId === managerCenterId;
    if (!inCenter) {
      throw new ForbiddenException('Access denied');
    }
  }

  private assertPlanEditAccess(plan: DailyPlanWithRelations, user: JwtPayload): void {
    if (!this.canUserEditPlan(plan, user)) {
      throw new ForbiddenException('You can only edit your own daily plans');
    }
  }

  async findAll(query: QueryDailyPlanDto, user: JwtPayload) {
    const userRole = user.role;
    const take = Math.min(Math.max(query.take ?? 50, 1), 200);
    const skip = Math.max(query.skip ?? 0, 0);

    if (userRole === UserRole.MANAGER && !user.managerCenterId) {
      return { items: [], total: 0, take, skip };
    }

    const whereParts: Prisma.DailyPlanWhereInput[] = [];

    if (query.teacherId) {
      if (userRole === UserRole.MANAGER) {
        const managerCenterId = user.managerCenterId;
        if (managerCenterId) {
          const teacherInCenter = await this.prisma.teacher.findFirst({
            where: {
              id: query.teacherId,
              ...this.managerTeacherAtCenterScope(managerCenterId),
            },
            select: { id: true },
          });
          if (!teacherInCenter) {
            throw new ForbiddenException('Teacher is not assigned to your center');
          }
        }
      }
      whereParts.push({ teacherId: query.teacherId });
    }

    if (query.groupId) whereParts.push({ groupId: query.groupId });
    if (query.lessonId) whereParts.push({ lessonId: query.lessonId });

    if (query.dateFrom || query.dateTo) {
      whereParts.push({
        date: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      });
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      whereParts.push({
        topics: {
          some: {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              {
                resources: {
                  some: {
                    OR: [
                      { title: { contains: term, mode: 'insensitive' } },
                      { description: { contains: term, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          },
        },
      });
    }

    if (userRole === UserRole.MANAGER) {
      const managerCenterId = user.managerCenterId;
      if (managerCenterId) {
        whereParts.push({
          teacher: this.managerTeacherAtCenterScope(managerCenterId),
        });
        whereParts.push({
          OR: [
            { group: { centerId: managerCenterId } },
            { lesson: { group: { centerId: managerCenterId } } },
          ],
        });
      }
    }

    const where: Prisma.DailyPlanWhereInput =
      whereParts.length === 0
        ? {}
        : whereParts.length === 1
          ? whereParts[0]
          : { AND: whereParts };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.dailyPlan.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: dailyPlanInclude,
        take,
        skip,
      }),
      this.prisma.dailyPlan.count({ where }),
    ]);

    return {
      items: items.map((plan) => this.serializePlan(plan, user)),
      total,
      take,
      skip,
    };
  }

  async findById(id: string, user: JwtPayload) {
    const plan = await this.prisma.dailyPlan.findUnique({
      where: { id },
      include: dailyPlanInclude,
    });
    if (!plan) {
      throw new NotFoundException(`Daily plan ${id} not found`);
    }
    await this.assertPlanViewAccess(plan, user);
    return this.serializePlan(plan, user);
  }

  async create(dto: CreateDailyPlanDto, user: JwtPayload) {
    const userId = user.sub;
    const userRole = user.role;
    if (!dto.topics?.length) {
      throw new BadRequestException('At least one topic is required');
    }

    const teacherId =
      userRole === UserRole.TEACHER
        ? await this.resolveTeacherId(userId)
        : null;

    let resolvedTeacherId: string | null = teacherId;
    let lessonGroupId: string | null = null;
    let resolvedDate: Date | null = null;

    if (dto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId },
        select: {
          id: true,
          groupId: true,
          scheduledAt: true,
          teacherId: true,
          substituteTeacherId: true,
        },
      });
      if (!lesson) {
        throw new BadRequestException(`Lesson ${dto.lessonId} not found`);
      }
      if (teacherId && !teacherActsAsLessonInstructor(lesson, teacherId)) {
        throw new ForbiddenException(
          'You can only create plans for your own lessons',
        );
      }
      resolvedTeacherId = effectiveLessonInstructorTeacherId(lesson);
      lessonGroupId = lesson.groupId;
      resolvedDate = lesson.scheduledAt;

      const existing = await this.prisma.dailyPlan.findUnique({
        where: { lessonId: dto.lessonId },
      });
      if (existing) {
        throw new BadRequestException(
          'A daily plan already exists for this lesson; update it instead.',
        );
      }
    }

    if (!resolvedTeacherId && dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
        select: { teacherId: true },
      });
      if (!group) {
        throw new BadRequestException(`Group ${dto.groupId} not found`);
      }
      if (!group.teacherId) {
        throw new BadRequestException('Selected group has no assigned teacher');
      }
      resolvedTeacherId = group.teacherId;
    }

    if (!resolvedTeacherId) {
      throw new BadRequestException('Teacher could not be resolved for this daily plan');
    }

    const date = resolvedDate ?? (dto.date ? new Date(dto.date) : new Date());

    const created = await this.prisma.dailyPlan.create({
      data: {
        teacherId: resolvedTeacherId,
        lessonId: dto.lessonId ?? null,
        groupId: dto.groupId ?? lessonGroupId ?? null,
        date,
        topics: { create: normalizeTopics(dto.topics) },
      },
      include: dailyPlanInclude,
    });

    await this.triggerSalaryRecalculationForPlan(created);
    return this.serializePlan(created, user);
  }

  async update(
    id: string,
    dto: UpdateDailyPlanDto,
    user: JwtPayload,
  ) {
    const existing = await this.prisma.dailyPlan.findUnique({
      where: { id },
      include: dailyPlanInclude,
    });
    if (!existing) {
      throw new NotFoundException(`Daily plan ${id} not found`);
    }
    this.assertPlanEditAccess(existing, user);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.topics) {
        await tx.dailyPlanTopic.deleteMany({ where: { dailyPlanId: id } });
        await tx.dailyPlanTopic.createMany({
          data: dto.topics.map((topic, idx) => ({
            dailyPlanId: id,
            title: topic.title.trim(),
            order: idx,
          })),
        });
        const newTopics = await tx.dailyPlanTopic.findMany({
          where: { dailyPlanId: id },
          orderBy: { order: 'asc' },
        });
        for (let i = 0; i < newTopics.length; i++) {
          const topicInput = dto.topics[i];
          await tx.dailyPlanResource.createMany({
            data: topicInput.resources.map((res) => {
              if (!RESOURCE_KINDS.has(res.kind)) {
                throw new BadRequestException(
                  `Unsupported resource kind: ${res.kind}`,
                );
              }
              return {
                topicId: newTopics[i].id,
                kind: res.kind as DailyPlanResourceKind,
                title: res.title.trim(),
                link: res.link?.trim() || null,
                description: res.description?.trim() || null,
              };
            }),
          });
        }
      }

      return tx.dailyPlan.update({
        where: { id },
        data: {
          groupId: dto.groupId === undefined ? undefined : dto.groupId ?? null,
          date: dto.date ? new Date(dto.date) : undefined,
        },
        include: dailyPlanInclude,
      });
    });

    return this.serializePlan(updated, user);
  }

  async remove(id: string, user: JwtPayload) {
    const existing = await this.prisma.dailyPlan.findUnique({
      where: { id },
      include: dailyPlanInclude,
    });
    if (!existing) {
      throw new NotFoundException(`Daily plan ${id} not found`);
    }
    this.assertPlanEditAccess(existing, user);
    await this.prisma.dailyPlan.delete({ where: { id } });
    await this.triggerSalaryRecalculationForPlan(existing);
    return { ok: true } as const;
  }
}
