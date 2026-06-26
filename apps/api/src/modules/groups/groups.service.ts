import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';
import { Prisma } from '@ilona/database';
import { ChatService } from '../chat/chat.service';
import { GroupScheduleLessonsService } from '../lessons/group-schedule-lessons.service';
import {
  buildScheduleJson,
  parseGroupSchedulePayload,
  type GroupCalendarStored,
  type GroupWeeklySlot,
} from './group-schedule-payload';
import {
  FIXED_GROUP_MAX_STUDENTS,
  GROUP_CAPACITY_EXCEEDED_MESSAGE,
} from './group.constants';
import { JwtPayload } from '../../common/types/auth.types';
import { assertManagerCenterAccess, getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { randomUUID } from 'crypto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly groupScheduleLessonsService: GroupScheduleLessonsService,
  ) {}

  private async assertManagerGroupAccess(groupId: string, user?: JwtPayload) {
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (!managerCenterId) return;

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, centerId: true },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    if (group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this group');
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    centerId?: string;
    teacherId?: string;
    isActive?: boolean;
    level?: string;
    /** Include students (user first/last name) in each group — for board cards. */
    includeStudents?: boolean;
    currentUser?: JwtPayload;
  }) {
    const {
      skip = 0,
      take = 50,
      search,
      centerId,
      teacherId,
      isActive,
      level,
      includeStudents,
      currentUser,
    } = params || {};

    const where: Prisma.GroupWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const scopedCenterId = assertManagerCenterAccess(currentUser, centerId);
    if (scopedCenterId) where.centerId = scopedCenterId;
    if (teacherId) {
      where.OR = [{ teacherId }, { secondTeacherId: teacherId }];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (level) where.level = level;

    const teacherInclude = {
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
    } as const;

    const listInclude = {
      center: {
        select: { id: true, name: true },
      },
      teacher: teacherInclude,
      secondTeacher: teacherInclude,
      _count: {
        select: { students: true, lessons: true },
      },
      ...(includeStudents
        ? {
            students: {
              orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          }
        : {}),
    } satisfies Prisma.GroupInclude;

    // Wrap both queries with retry
    const [items, total] = await Promise.all([
      this.prisma.prismaWithRetry(
        () =>
          this.prisma.group.findMany({
            where,
            skip,
            take,
            orderBy: { name: 'asc' },
            include: listInclude,
          }),
        { op: 'groups.findAll', meta: { skip, take, teacherId, centerId } },
      ),
      this.prisma.prismaWithRetry(
        () => this.prisma.group.count({ where }),
        { op: 'groups.findAll.count', meta: { teacherId, centerId } },
      ),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Get paginated list of students in a group. Admin-only.
   */
  async findStudentsByGroupId(
    groupId: string,
    params?: { skip?: number; take?: number },
    currentUser?: JwtPayload,
  ) {
    const { skip = 0, take = 20 } = params || {};
    await this.findById(groupId, currentUser);

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where: { groupId },
        skip,
        take,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.student.count({ where: { groupId } }),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string, currentUser?: JwtPayload) {
    await this.assertManagerGroupAccess(id, currentUser);

    const detailTeacherInclude = {
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    } as const;

    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        center: true,
        teacher: detailTeacherInclude,
        secondTeacher: detailTeacherInclude,
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
        chat: {
          select: { id: true },
        },
        _count: {
          select: { students: true, lessons: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  /**
   * Get teacher entity by userId (canonical lookup method)
   */
  async getTeacherByUserId(userId: string) {
    return this.prisma.prismaWithRetry(
      () =>
        this.prisma.teacher.findUnique({
          where: { userId },
          select: { id: true },
        }),
      { op: 'groups.getTeacherByUserId', meta: { userId } },
    );
  }

  /**
   * Get all groups assigned to a teacher by teacherId
   * This is the canonical method for fetching teacher groups - used by all endpoints
   */
  async findByTeacher(teacherId: string) {
    // Include groups where the teacher is assigned as either rotation teacher.
    const groups = await this.prisma.prismaWithRetry(
      () =>
        this.prisma.group.findMany({
          where: {
            isActive: true,
            OR: [{ teacherId }, { secondTeacherId: teacherId }],
          },
          include: {
            center: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
            secondTeacher: {
              select: {
                id: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
            _count: { select: { lessons: true } },
          },
          orderBy: { name: 'asc' },
        }),
      { op: 'groups.findByTeacher', meta: { teacherId } },
    );

    // Count only ACTIVE students for each group
    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) {
      return [];
    }

    // Wrap student count query with retry
    const activeStudentCounts = await this.prisma.prismaWithRetry(
      () =>
        this.prisma.student.groupBy({
          by: ['groupId'],
          where: {
            groupId: { in: groupIds },
            user: { status: 'ACTIVE' },
          },
          _count: { id: true },
        }),
      { op: 'groups.findByTeacher.studentCount', meta: { teacherId, groupCount: groupIds.length } },
    );

    const countMap = new Map(
      activeStudentCounts.map(item => [item.groupId, item._count.id])
    );

    // Add student counts to groups
    return groups.map(group => ({
      ...group,
      _count: {
        ...group._count,
        students: countMap.get(group.id) || 0,
      },
    }));
  }

  /**
   * Get all groups assigned to a teacher by userId
   * This method ensures consistent lookup across all endpoints
   */
  async findByTeacherUserId(userId: string) {
    const teacher = await this.getTeacherByUserId(userId);
    if (!teacher) {
      return [];
    }
    return this.findByTeacher(teacher.id);
  }

  private validateGroupTeachers(params: {
    teacherId?: string | null;
    secondTeacherId?: string | null;
    requireBoth?: boolean;
  }) {
    const teacherId = params.teacherId ?? null;
    const secondTeacherId = params.secondTeacherId ?? null;

    if (params.requireBoth) {
      if (!teacherId || !secondTeacherId) {
        throw new BadRequestException('Assign both teachers to the group.');
      }
    }

    if (teacherId && secondTeacherId && teacherId === secondTeacherId) {
      throw new BadRequestException('The two group teachers must be different people.');
    }
  }

  private async assertTeachersExist(teacherIds: string[]) {
    for (const id of teacherIds) {
      const teacher = await this.prisma.teacher.findUnique({ where: { id } });
      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${id} not found`);
      }
    }
  }

  private async assertTeachersBelongToCenter(centerId: string, teacherIds: string[]) {
    for (const teacherId of teacherIds) {
      const hasCenterLink = await this.prisma.teacherCenter.findFirst({
        where: { teacherId, centerId },
      });
      if (hasCenterLink) continue;

      const teachesGroupAtCenter = await this.prisma.group.findFirst({
        where: { centerId, teacherId },
      });
      if (teachesGroupAtCenter) continue;

      throw new BadRequestException(
        `Teacher with ID ${teacherId} is not assigned to the selected center`,
      );
    }
  }

  private async syncGroupTeachersInChat(
    groupId: string,
    groupName: string,
    teacherIds: Array<string | null | undefined>,
  ) {
    const uniqueTeacherIds = [...new Set(teacherIds.filter(Boolean))] as string[];
    if (uniqueTeacherIds.length === 0) return;

    let chat = await this.prisma.chat.findUnique({ where: { groupId } });
    if (!chat) {
      chat = await this.createGroupChat(groupId, groupName, uniqueTeacherIds);
      return;
    }

    for (const tid of uniqueTeacherIds) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: tid },
        select: { userId: true },
      });
      if (!teacher) continue;
      await this.prisma.chatParticipant.upsert({
        where: { chatId_userId: { chatId: chat.id, userId: teacher.userId } },
        update: { isAdmin: true, leftAt: null },
        create: { chatId: chat.id, userId: teacher.userId, isAdmin: true },
      });
    }
  }

  async create(dto: CreateGroupDto, currentUser?: JwtPayload) {
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);
    if (managerCenterId && dto.centerId !== managerCenterId) {
      throw new ForbiddenException('You can only create groups in your assigned center');
    }

    // Validate center exists
    const center = await this.prisma.center.findUnique({
      where: { id: dto.centerId },
    });

    if (!center) {
      throw new BadRequestException(`Center with ID ${dto.centerId} not found`);
    }

    this.validateGroupTeachers({
      teacherId: dto.teacherId,
      secondTeacherId: dto.secondTeacherId,
      requireBoth: true,
    });

    const teacherIdsToValidate = [dto.teacherId, dto.secondTeacherId].filter(Boolean) as string[];
    const uniqueTeacherIds = [...new Set(teacherIdsToValidate)];
    await this.assertTeachersExist(uniqueTeacherIds);
    await this.assertTeachersBelongToCenter(dto.centerId, uniqueTeacherIds);

    if (dto.calendarPlan) {
      if (!dto.schedule?.length) {
        throw new BadRequestException('Add at least one weekly time slot to generate calendar lessons.');
      }
    }

    const weeklySlots = (dto.schedule ?? []) as GroupWeeklySlot[];
    const nextCalendar: GroupCalendarStored | null = dto.calendarPlan
      ? {
          dateFrom: dto.calendarPlan.dateFrom,
          dateTo: dto.calendarPlan.dateTo,
          topic: dto.calendarPlan.topic,
          description: dto.calendarPlan.description,
          suppressedSlotStarts: [],
        }
      : null;

    const scheduleForCreate =
      buildScheduleJson(weeklySlots, nextCalendar) ??
      (weeklySlots.length > 0 ? (weeklySlots as unknown as Prisma.InputJsonValue) : undefined);

    const groupInclude = {
      center: { select: { id: true, name: true } },
      teacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
      secondTeacher: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    } as const;

    let group = await this.prisma.group.create({
      data: {
        name: dto.name,
        level: dto.level,
        description: dto.description,
        iconKey: dto.iconKey ?? null,
        maxStudents: FIXED_GROUP_MAX_STUDENTS,
        centerId: dto.centerId,
        teacherId: dto.teacherId,
        secondTeacherId: dto.secondTeacherId,
        secondTeacherStartsFirstWeek: dto.secondTeacherStartsFirstWeek ?? false,
        schedule: scheduleForCreate ?? undefined,
        isActive: dto.isActive ?? true,
      },
      include: groupInclude,
    });

    await this.createGroupChat(group.id, group.name, [
      dto.teacherId as string,
      dto.secondTeacherId as string,
    ]);

    const syncedSchedule = await this.groupScheduleLessonsService.syncAfterGroupSaved({
      groupId: group.id,
      teacherId: group.teacherId,
      secondTeacherId: group.secondTeacherId,
      secondTeacherStartsFirstWeek: group.secondTeacherStartsFirstWeek,
      weeklySlots,
      calendar: nextCalendar,
      previousScheduleJson: null,
      previousTeacherId: null,
      previousSecondTeacherId: null,
      previousSecondTeacherStartsFirstWeek: null,
      confirmReplaceGeneratedLessons: false,
    });

    if (syncedSchedule !== undefined) {
      group = await this.prisma.group.update({
        where: { id: group.id },
        data: { schedule: syncedSchedule },
        include: groupInclude,
      });
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto, currentUser?: JwtPayload) {
    await this.assertManagerGroupAccess(id, currentUser);
    const currentGroup = await this.findById(id, currentUser);
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);

    // Validate center if changing (centerId is required in DB, so if provided it must be valid)
    if (dto.centerId !== undefined) {
      if (!dto.centerId || dto.centerId.trim() === '') {
        throw new BadRequestException('Center ID cannot be empty. A group must belong to a center.');
      }

      const center = await this.prisma.center.findUnique({
        where: { id: dto.centerId },
      });

      if (!center) {
        throw new BadRequestException(`Center with ID ${dto.centerId} not found`);
      }
      if (managerCenterId && dto.centerId !== managerCenterId) {
        throw new ForbiddenException('You can only move group inside your assigned center');
      }
    }

    const nextTeacherId =
      dto.teacherId !== undefined ? dto.teacherId || null : currentGroup.teacherId;
    const nextSecondTeacherId =
      dto.secondTeacherId !== undefined
        ? dto.secondTeacherId || null
        : currentGroup.secondTeacherId;

    const nextSecondTeacherStartsFirstWeek =
      dto.secondTeacherStartsFirstWeek !== undefined
        ? dto.secondTeacherStartsFirstWeek
        : currentGroup.secondTeacherStartsFirstWeek;

    this.validateGroupTeachers({
      teacherId: nextTeacherId,
      secondTeacherId: nextSecondTeacherId,
      requireBoth: true,
    });

    const nextCenterId =
      dto.centerId !== undefined ? dto.centerId : currentGroup.centerId;

    const teacherIdsToValidate = [nextTeacherId, nextSecondTeacherId].filter(Boolean) as string[];
    const uniqueTeacherIds = [...new Set(teacherIdsToValidate)];
    await this.assertTeachersExist(uniqueTeacherIds);
    await this.assertTeachersBelongToCenter(nextCenterId, uniqueTeacherIds);

    // Sync chat participants when group teachers change
    const oldTeacherIds = [currentGroup.teacherId, currentGroup.secondTeacherId];
    const newTeacherIds = [nextTeacherId, nextSecondTeacherId];
    const teachersChangedForChat =
      oldTeacherIds.some((id, i) => id !== newTeacherIds[i]) ||
      dto.teacherId !== undefined ||
      dto.secondTeacherId !== undefined;

    if (teachersChangedForChat) {
      for (const oldId of oldTeacherIds) {
        if (!oldId || newTeacherIds.includes(oldId)) continue;
        const oldTeacher = await this.prisma.teacher.findUnique({
          where: { id: oldId },
          select: { userId: true },
        });
        if (!oldTeacher) continue;
        const chat = await this.prisma.chat.findUnique({ where: { groupId: id } });
        if (!chat) continue;
        await this.prisma.chatParticipant.updateMany({
          where: { chatId: chat.id, userId: oldTeacher.userId },
          data: { leftAt: new Date() },
        });
      }
      await this.syncGroupTeachersInChat(id, currentGroup.name, newTeacherIds);
    }

    const {
      schedule: scheduleDto,
      calendarPlan,
      confirmReplaceGeneratedLessons,
      teacherId: _dtoTeacherId,
      secondTeacherId,
      secondTeacherStartsFirstWeek: _dtoSecondTeacherStartsFirstWeek,
      ...rest
    } = dto;

    const prevParsed = parseGroupSchedulePayload(currentGroup.schedule);

    const nextWeekly: GroupWeeklySlot[] =
      scheduleDto !== undefined ? ((scheduleDto ?? []) as GroupWeeklySlot[]) : prevParsed.weeklySlots;

    let nextCalendar: GroupCalendarStored | null;
    if (calendarPlan === undefined) {
      nextCalendar = prevParsed.calendar;
    } else if (calendarPlan === null) {
      nextCalendar = null;
    } else {
      nextCalendar = {
        dateFrom: calendarPlan.dateFrom,
        dateTo: calendarPlan.dateTo,
        topic: calendarPlan.topic,
        description: calendarPlan.description,
        suppressedSlotStarts: prevParsed.calendar?.suppressedSlotStarts ?? [],
      };
    }

    if (nextCalendar) {
      if (nextWeekly.length === 0) {
        throw new BadRequestException('Add at least one weekly time slot for calendar generation.');
      }
    }

    let finalSchedule: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
      buildScheduleJson(nextWeekly, nextCalendar) ??
      (nextWeekly.length > 0
        ? (nextWeekly as unknown as Prisma.InputJsonValue)
        : scheduleDto === null
          ? Prisma.JsonNull
          : undefined);

    const synced = await this.groupScheduleLessonsService.syncAfterGroupSaved({
      groupId: id,
      teacherId: nextTeacherId,
      secondTeacherId: nextSecondTeacherId,
      secondTeacherStartsFirstWeek: nextSecondTeacherStartsFirstWeek,
      weeklySlots: nextWeekly,
      calendar: nextCalendar,
      previousScheduleJson: currentGroup.schedule,
      previousTeacherId: currentGroup.teacherId,
      previousSecondTeacherId: currentGroup.secondTeacherId,
      previousSecondTeacherStartsFirstWeek: currentGroup.secondTeacherStartsFirstWeek,
      confirmReplaceGeneratedLessons: confirmReplaceGeneratedLessons ?? false,
    });
    if (synced !== undefined) {
      finalSchedule = synced;
    }

    if (finalSchedule === undefined && nextWeekly.length === 0 && !nextCalendar) {
      finalSchedule = Prisma.JsonNull;
    }

    const scheduleUpdate =
      finalSchedule !== undefined ? { schedule: finalSchedule } : {};

    return this.prisma.group.update({
      where: { id },
      data: {
        ...rest,
        ...(secondTeacherId !== undefined ? { secondTeacherId: secondTeacherId || null } : {}),
        ...(dto.secondTeacherStartsFirstWeek !== undefined
          ? { secondTeacherStartsFirstWeek: dto.secondTeacherStartsFirstWeek }
          : {}),
        teacherId: nextTeacherId,
        ...scheduleUpdate,
        maxStudents: FIXED_GROUP_MAX_STUDENTS,
      },
      include: {
        center: { select: { id: true, name: true } },
        teacher: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        secondTeacher: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async delete(id: string, currentUser?: JwtPayload) {
    await this.findById(id, currentUser);

    return this.prisma.group.delete({
      where: { id },
    });
  }

  async toggleActive(id: string, currentUser?: JwtPayload) {
    const group = await this.findById(id, currentUser);

    return this.prisma.group.update({
      where: { id },
      data: { isActive: !group.isActive },
    });
  }

  async assignTeacher(groupId: string, teacherId: string, currentUser?: JwtPayload) {
    await this.assertManagerGroupAccess(groupId, currentUser);
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);

    if (managerCenterId) {
      const teacherInCenter = await this.prisma.group.findFirst({
        where: { teacherId, centerId: managerCenterId },
        select: { id: true },
      });

      if (!teacherInCenter) {
        throw new ForbiddenException('You can only assign teachers from your center');
      }
    }

    // Use transaction to ensure atomicity: Group.teacherId and ChatParticipant must be updated together
    return await this.prisma.$transaction(async (tx) => {
      // Verify group exists
      const existingGroup = await tx.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true, teacherId: true },
      });

      if (!existingGroup) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      // Verify teacher exists
      const teacher = await tx.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${teacherId} not found`);
      }

      // If group already has a different teacher, we'll update it (old teacher's ChatParticipant remains but new one is added)
      // Update group.teacherId (this is the canonical source of truth)
      const group = await tx.group.update({
        where: { id: groupId },
        data: { teacherId },
        include: {
          center: { select: { id: true, name: true } },
          teacher: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      // Ensure group chat exists and teacher is added as participant
      let chat = await tx.chat.findUnique({
        where: { groupId },
      });

      // Create chat if it doesn't exist
      if (!chat) {
        chat = await tx.chat.create({
          data: {
            type: 'GROUP',
            name: group.name,
            groupId,
          },
        });

        // Add teacher as admin
        await tx.chatParticipant.create({
          data: {
            chatId: chat.id,
            userId: teacher.userId,
            isAdmin: true,
          },
        });
      } else {
        // Add teacher to existing chat (upsert ensures idempotency)
        await tx.chatParticipant.upsert({
          where: {
            chatId_userId: { chatId: chat.id, userId: teacher.userId },
          },
          update: { isAdmin: true, leftAt: null },
          create: {
            chatId: chat.id,
            userId: teacher.userId,
            isAdmin: true,
          },
        });
      }

      return group;
    });
  }

  async addStudent(groupId: string, studentId: string, currentUser?: JwtPayload) {
    await this.findById(groupId, currentUser);
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);

    // Check max students
    const currentCount = await this.prisma.student.count({
      where: { groupId },
    });

    if (currentCount >= FIXED_GROUP_MAX_STUDENTS) {
      throw new BadRequestException(GROUP_CAPACITY_EXCEEDED_MESSAGE);
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${studentId} not found`);
    }

    if (managerCenterId) {
      const studentInCenter = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          group: { centerId: managerCenterId },
        },
        select: { id: true },
      });

      if (!studentInCenter) {
        throw new ForbiddenException('You can only add students from your assigned center');
      }
    }

    const now = new Date();
    const previousGroupId = student.groupId ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: { groupId },
      });

      if (previousGroupId !== groupId) {
        if (previousGroupId) {
          await tx.$executeRaw`
            UPDATE "student_group_histories"
            SET "leftAt" = ${now}, "updatedAt" = ${now}
            WHERE "studentId" = ${studentId} AND "leftAt" IS NULL
          `;
        }

        await tx.$executeRaw`
          INSERT INTO "student_group_histories" ("id", "studentId", "groupId", "joinedAt", "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${studentId}, ${groupId}, ${now}, ${now}, ${now})
        `;
      }
    });

    // Add student to group chat
    const chat = await this.prisma.chat.findUnique({
      where: { groupId },
    });

    if (chat) {
      await this.prisma.chatParticipant.upsert({
        where: {
          chatId_userId: { chatId: chat.id, userId: student.userId },
        },
        update: { leftAt: null },
        create: {
          chatId: chat.id,
          userId: student.userId,
          isAdmin: false,
        },
      });
    }

    // Automatically create 1:1 direct chat between Student and assigned Teacher (if group has teacher)
    const groupWithTeacher = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        teacher: {
          include: { user: { select: { id: true } } },
        },
      },
    });
    if (groupWithTeacher?.teacherId && groupWithTeacher.teacher?.user?.id) {
      const teacherUserId = groupWithTeacher.teacher.user.id;
      try {
        await this.chatService.createDirectChat(
          { participantIds: [teacherUserId] },
          student.userId,
        );
      } catch {
        // Ignore errors (e.g. duplicate or validation); chat may already exist
      }
    }

    return { success: true };
  }

  async removeStudent(groupId: string, studentId: string, currentUser?: JwtPayload) {
    await this.assertManagerGroupAccess(groupId, currentUser);
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.groupId !== groupId) {
      throw new BadRequestException('Student is not in this group');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: { groupId: null },
      });

      await tx.$executeRaw`
        UPDATE "student_group_histories"
        SET "leftAt" = ${now}, "updatedAt" = ${now}
        WHERE "studentId" = ${studentId} AND "leftAt" IS NULL
      `;
    });

    // Mark as left in chat
    const chat = await this.prisma.chat.findUnique({
      where: { groupId },
    });

    if (chat) {
      await this.prisma.chatParticipant.updateMany({
        where: {
          chatId: chat.id,
          userId: student.userId,
        },
        data: { leftAt: new Date() },
      });
    }

    return { success: true };
  }

  private async createGroupChat(
    groupId: string,
    groupName: string,
    teacherIds?: string | string[],
  ) {
    const chat = await this.prisma.chat.create({
      data: {
        type: 'GROUP',
        name: groupName,
        groupId,
      },
    });

    const ids = (Array.isArray(teacherIds) ? teacherIds : teacherIds ? [teacherIds] : []).filter(
      Boolean,
    );

    for (const teacherId of [...new Set(ids)]) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });

      if (teacher) {
        await this.prisma.chatParticipant.create({
          data: {
            chatId: chat.id,
            userId: teacher.userId,
            isAdmin: true,
          },
        });
      }
    }

    return chat;
  }
}

