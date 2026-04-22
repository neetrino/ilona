import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDailyPlanDto,
  UpdateDailyPlanDto,
  QueryDailyPlanDto,
  DailyPlanTopicInputDto,
} from './dto';
import { DailyPlanResourceKind, Prisma, UserRole } from '@ilona/database';

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
  group: { select: { id: true, name: true, level: true } },
  lesson: { select: { id: true, scheduledAt: true } },
  teacher: {
    select: {
      id: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.DailyPlanInclude;

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
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll(query: QueryDailyPlanDto, userId: string, userRole: UserRole) {
    const where: Prisma.DailyPlanWhereInput = {};

    if (userRole === UserRole.TEACHER) {
      where.teacherId = await this.resolveTeacherId(userId);
    } else if (query.teacherId) {
      where.teacherId = query.teacherId;
    }

    if (query.groupId) where.groupId = query.groupId;
    if (query.lessonId) where.lessonId = query.lessonId;

    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.topics = {
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
      };
    }

    const take = Math.min(Math.max(query.take ?? 50, 1), 200);
    const skip = Math.max(query.skip ?? 0, 0);

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

    return { items, total, take, skip };
  }

  async findById(id: string, userId: string, userRole: UserRole) {
    const plan = await this.prisma.dailyPlan.findUnique({
      where: { id },
      include: dailyPlanInclude,
    });
    if (!plan) {
      throw new NotFoundException(`Daily plan ${id} not found`);
    }
    if (userRole === UserRole.TEACHER) {
      const teacherId = await this.resolveTeacherId(userId);
      if (plan.teacherId !== teacherId) {
        throw new ForbiddenException('You can only view your own daily plans');
      }
    }
    return plan;
  }

  async create(dto: CreateDailyPlanDto, userId: string, userRole: UserRole) {
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
        select: { id: true, groupId: true, scheduledAt: true, teacherId: true },
      });
      if (!lesson) {
        throw new BadRequestException(`Lesson ${dto.lessonId} not found`);
      }
      if (teacherId && lesson.teacherId !== teacherId) {
        throw new ForbiddenException(
          'You can only create plans for your own lessons',
        );
      }
      resolvedTeacherId = lesson.teacherId;
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

    return this.prisma.dailyPlan.create({
      data: {
        teacherId: resolvedTeacherId,
        lessonId: dto.lessonId ?? null,
        groupId: dto.groupId ?? lessonGroupId ?? null,
        date,
        topics: { create: normalizeTopics(dto.topics) },
      },
      include: dailyPlanInclude,
    });
  }

  async update(
    id: string,
    dto: UpdateDailyPlanDto,
    userId: string,
    userRole: UserRole,
  ) {
    const existing = await this.findById(id, userId, userRole);

    return this.prisma.$transaction(async (tx) => {
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
    }).then(() =>
      this.prisma.dailyPlan.findUnique({
        where: { id: existing.id },
        include: dailyPlanInclude,
      }),
    );
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    await this.findById(id, userId, userRole);
    await this.prisma.dailyPlan.delete({ where: { id } });
    return { ok: true } as const;
  }
}
