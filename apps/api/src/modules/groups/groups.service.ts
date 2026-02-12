import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    centerId?: string;
    teacherId?: string;
    isActive?: boolean;
    level?: string;
  }) {
    const { skip = 0, take = 50, search, centerId, teacherId, isActive, level } = params || {};

    const where: Prisma.GroupWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (centerId) where.centerId = centerId;
    if (teacherId) where.teacherId = teacherId;
    if (isActive !== undefined) where.isActive = isActive;
    if (level) where.level = level;

    const [items, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          center: {
            select: { id: true, name: true },
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
          _count: {
            select: { students: true, lessons: true },
          },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        center: true,
        teacher: {
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
        },
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

  async findByTeacher(teacherId: string) {
    const groups = await this.prisma.group.findMany({
      where: { teacherId, isActive: true },
      include: {
        center: { select: { id: true, name: true } },
        _count: { select: { lessons: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Count only ACTIVE students for each group
    const groupIds = groups.map(g => g.id);
    const activeStudentCounts = await this.prisma.student.groupBy({
      by: ['groupId'],
      where: {
        groupId: { in: groupIds },
        user: { status: 'ACTIVE' },
      },
      _count: { id: true },
    });

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

  async create(dto: CreateGroupDto) {
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

    // Create group
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        level: dto.level,
        description: dto.description,
        maxStudents: dto.maxStudents ?? 15,
        centerId: dto.centerId,
        teacherId: dto.teacherId,
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
      },
    });

    // Create group chat automatically
    await this.createGroupChat(group.id, group.name, dto.teacherId);

    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    const currentGroup = await this.findById(id);

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

    return this.prisma.group.update({
      where: { id },
      data: dto,
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
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.group.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const group = await this.findById(id);

    return this.prisma.group.update({
      where: { id },
      data: { isActive: !group.isActive },
    });
  }

  async assignTeacher(groupId: string, teacherId: string) {
    await this.findById(groupId);

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${teacherId} not found`);
    }

    // Update group
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: { teacherId },
    });

    // Ensure group chat exists and teacher is added as participant
    let chat = await this.prisma.chat.findUnique({
      where: { groupId },
    });

    // Create chat if it doesn't exist
    if (!chat) {
      chat = await this.createGroupChat(groupId, group.name, teacherId);
    } else {
      // Add teacher to existing chat
      await this.prisma.chatParticipant.upsert({
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
  }

  async addStudent(groupId: string, studentId: string) {
    const group = await this.findById(groupId);

    // Check max students
    const currentCount = await this.prisma.student.count({
      where: { groupId },
    });

    if (currentCount >= group.maxStudents) {
      throw new BadRequestException('Group is full');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${studentId} not found`);
    }

    // Update student's group
    await this.prisma.student.update({
      where: { id: studentId },
      data: { groupId },
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

    return { success: true };
  }

  async removeStudent(groupId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.groupId !== groupId) {
      throw new BadRequestException('Student is not in this group');
    }

    // Remove from group
    await this.prisma.student.update({
      where: { id: studentId },
      data: { groupId: null },
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

