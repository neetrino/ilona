import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';
import { Prisma } from '@ilona/database';
import { ChatService } from '../chat/chat.service';
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
    if (teacherId) where.teacherId = teacherId;
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
      substituteTeacher: teacherInclude,
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
        substituteTeacher: detailTeacherInclude,
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
    // Wrap main query with retry for transient connection errors
    const groups = await this.prisma.prismaWithRetry(
      () =>
        this.prisma.group.findMany({
          where: { teacherId, isActive: true },
          include: {
            center: { select: { id: true, name: true } },
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

    // Validate teacher if provided
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
      }
    }

    if (dto.substituteTeacherId) {
      if (dto.substituteTeacherId === dto.teacherId) {
        throw new BadRequestException(
          'Substitute teacher cannot be the same as the main teacher',
        );
      }
      const substitute = await this.prisma.teacher.findUnique({
        where: { id: dto.substituteTeacherId },
      });
      if (!substitute) {
        throw new BadRequestException(
          `Substitute teacher with ID ${dto.substituteTeacherId} not found`,
        );
      }
    }

    // Create group
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        level: dto.level,
        description: dto.description,
        maxStudents: FIXED_GROUP_MAX_STUDENTS,
        centerId: dto.centerId,
        teacherId: dto.teacherId,
        substituteTeacherId: dto.substituteTeacherId,
        schedule: dto.schedule ? (dto.schedule as unknown as Prisma.InputJsonValue) : undefined,
        isActive: dto.isActive ?? true,
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
        substituteTeacher: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    // Create group chat automatically
    await this.createGroupChat(group.id, group.name, dto.teacherId);

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

    // Validate teacher if changing
    if (dto.teacherId !== undefined) {
      if (dto.teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: dto.teacherId },
        });

        if (!teacher) {
          throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
        }
      }

      // Handle teacher assignment/removal
      const oldTeacherId = currentGroup.teacherId;
      const newTeacherId = dto.teacherId || null;

      // If teacher is being removed, mark them as left in chat
      if (oldTeacherId && oldTeacherId !== newTeacherId) {
        const oldTeacher = await this.prisma.teacher.findUnique({
          where: { id: oldTeacherId },
          select: { userId: true },
        });

        if (oldTeacher) {
          const chat = await this.prisma.chat.findUnique({
            where: { groupId: id },
          });

          if (chat) {
            await this.prisma.chatParticipant.updateMany({
              where: {
                chatId: chat.id,
                userId: oldTeacher.userId,
              },
              data: { leftAt: new Date() },
            });
          }
        }
      }

      // If new teacher is being assigned, ensure they're added to chat
      if (newTeacherId && newTeacherId !== oldTeacherId) {
        const newTeacher = await this.prisma.teacher.findUnique({
          where: { id: newTeacherId },
          include: { user: true },
        });

        if (newTeacher) {
          let chat = await this.prisma.chat.findUnique({
            where: { groupId: id },
          });

          if (!chat) {
            chat = await this.createGroupChat(id, currentGroup.name, newTeacherId);
          } else {
            await this.prisma.chatParticipant.upsert({
              where: {
                chatId_userId: { chatId: chat.id, userId: newTeacher.userId },
              },
              update: { isAdmin: true, leftAt: null },
              create: {
                chatId: chat.id,
                userId: newTeacher.userId,
                isAdmin: true,
              },
            });
          }
        }
      }
    }

    if (dto.substituteTeacherId !== undefined) {
      const nextSub = dto.substituteTeacherId || null;
      const nextMain = dto.teacherId !== undefined ? (dto.teacherId || null) : currentGroup.teacherId;
      if (nextSub && nextSub === nextMain) {
        throw new BadRequestException(
          'Substitute teacher cannot be the same as the main teacher',
        );
      }
      if (nextSub) {
        const substitute = await this.prisma.teacher.findUnique({
          where: { id: nextSub },
        });
        if (!substitute) {
          throw new BadRequestException(
            `Substitute teacher with ID ${nextSub} not found`,
          );
        }
      }
    }

    const { schedule: scheduleDto, substituteTeacherId, ...rest } = dto;
    const scheduleData =
      scheduleDto === undefined
        ? {}
        : scheduleDto === null
          ? { schedule: Prisma.JsonNull }
          : { schedule: scheduleDto as unknown as Prisma.InputJsonValue };

    return this.prisma.group.update({
      where: { id },
      data: {
        ...rest,
        ...(substituteTeacherId !== undefined
          ? { substituteTeacherId: substituteTeacherId || null }
          : {}),
        ...scheduleData,
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
        substituteTeacher: {
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

  private async createGroupChat(groupId: string, groupName: string, teacherId?: string) {
    const chat = await this.prisma.chat.create({
      data: {
        type: 'GROUP',
        name: groupName,
        groupId,
      },
    });

    // Add teacher as admin if exists
    if (teacherId) {
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

