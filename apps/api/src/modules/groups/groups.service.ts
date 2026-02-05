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
    return this.prisma.group.findMany({
      where: { teacherId, isActive: true },
      include: {
        center: { select: { id: true, name: true } },
        _count: { select: { students: true, lessons: true } },
      },
      orderBy: { name: 'asc' },
    });
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
    await this.findById(id);

    // Validate center if changing
    if (dto.centerId) {
      const center = await this.prisma.center.findUnique({
        where: { id: dto.centerId },
      });

      if (!center) {
        throw new BadRequestException(`Center with ID ${dto.centerId} not found`);
      }
    }

    // Validate teacher if changing
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
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

    // Add teacher to group chat if exists
    const chat = await this.prisma.chat.findUnique({
      where: { groupId },
    });

    if (chat) {
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

