import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    groupId?: string;
    status?: UserStatus;
  }) {
    const { skip = 0, take = 50, search, groupId, status } = params || {};

    const where: Prisma.StudentWhereInput = {};
    const userWhere: Prisma.UserWhereInput = {};

    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      userWhere.status = status;
    }

    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { user: { firstName: 'asc' } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatarUrl: true,
              status: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              level: true,
              center: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
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
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        group: {
          include: {
            center: true,
            teacher: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
        attendances: {
          take: 10,
          orderBy: { lesson: { scheduledAt: 'desc' } },
          include: {
            lesson: {
              select: { id: true, scheduledAt: true, topic: true },
            },
          },
        },
        feedbacks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            lesson: { select: { id: true, scheduledAt: true, topic: true } },
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByUserId(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        group: {
          include: {
            center: true,
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student profile not found`);
    }

    return student;
  }

  async create(dto: CreateStudentDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate group if provided
    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: dto.groupId },
        include: { _count: { select: { students: true } } },
      });

      if (!group) {
        throw new BadRequestException(`Group with ID ${dto.groupId} not found`);
      }

      if (group._count.students >= group.maxStudents) {
        throw new BadRequestException('Group is full');
      }
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

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user and student in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      });

      // Create student profile
      // NOTE: teacherId will be added after migration is run
      const student = await tx.student.create({
        data: {
          userId: user.id,
          groupId: dto.groupId,
          // teacherId: dto.teacherId, // Uncomment after migration
          parentName: dto.parentName,
          parentPhone: dto.parentPhone,
          parentEmail: dto.parentEmail,
          monthlyFee: dto.monthlyFee,
          notes: dto.notes,
          receiveReports: dto.receiveReports ?? true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true,
            },
          },
          group: { select: { id: true, name: true } },
        },
      });

      // Add to group chat if group exists
      if (dto.groupId) {
        const chat = await tx.chat.findUnique({
          where: { groupId: dto.groupId },
        });

        if (chat) {
          await tx.chatParticipant.create({
            data: {
              chatId: chat.id,
              userId: user.id,
              isAdmin: false,
            },
          });
        }
      }

      return student;
    });

    return result;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.findById(id);

    // Validate teacher if provided
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
      }
    }

    // Update user fields if provided
    if (dto.firstName || dto.lastName || dto.phone || dto.status) {
      await this.prisma.user.update({
        where: { id: student.user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: dto.status,
        },
      });
    }

    // Update student fields
    // NOTE: teacherId will be added after migration is run
    const updateData: any = {
      parentName: dto.parentName,
      parentPhone: dto.parentPhone,
      parentEmail: dto.parentEmail,
      monthlyFee: dto.monthlyFee,
      notes: dto.notes,
      receiveReports: dto.receiveReports,
    };
    
    // Only include these fields if provided
    if (dto.groupId !== undefined) {
      updateData.groupId = dto.groupId;
    }
    // teacherId: dto.teacherId, // Uncomment after migration
    
    return this.prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
          },
        },
        group: { select: { id: true, name: true } },
      },
    });
  }

  async changeGroup(id: string, newGroupId: string | null) {
    const student = await this.findById(id);
    const oldGroupId = student.groupId;

    // Validate new group if provided
    if (newGroupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: newGroupId },
        include: { _count: { select: { students: true } } },
      });

      if (!group) {
        throw new BadRequestException(`Group with ID ${newGroupId} not found`);
      }

      if (group._count.students >= group.maxStudents) {
        throw new BadRequestException('Group is full');
      }
    }

    // Update student group
    await this.prisma.student.update({
      where: { id },
      data: { groupId: newGroupId },
    });

    // Update chat memberships
    if (oldGroupId) {
      const oldChat = await this.prisma.chat.findUnique({
        where: { groupId: oldGroupId },
      });

      if (oldChat) {
        await this.prisma.chatParticipant.updateMany({
          where: { chatId: oldChat.id, userId: student.user.id },
          data: { leftAt: new Date() },
        });
      }
    }

    if (newGroupId) {
      const newChat = await this.prisma.chat.findUnique({
        where: { groupId: newGroupId },
      });

      if (newChat) {
        await this.prisma.chatParticipant.upsert({
          where: {
            chatId_userId: { chatId: newChat.id, userId: student.user.id },
          },
          update: { leftAt: null },
          create: {
            chatId: newChat.id,
            userId: student.user.id,
            isAdmin: false,
          },
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const student = await this.findById(id);

    // Delete user (cascades to student)
    await this.prisma.user.delete({
      where: { id: student.user.id },
    });

    return { success: true };
  }

  async getStatistics(id: string) {
    await this.findById(id);

    // Get attendance stats
    const totalAttendances = await this.prisma.attendance.count({
      where: { studentId: id },
    });

    const presentCount = await this.prisma.attendance.count({
      where: { studentId: id, isPresent: true },
    });

    const unjustifiedAbsences = await this.prisma.attendance.count({
      where: { studentId: id, isPresent: false, absenceType: 'UNJUSTIFIED' },
    });

    // Get payments stats
    const pendingPayments = await this.prisma.payment.count({
      where: { studentId: id, status: 'PENDING' },
    });

    const overduePayments = await this.prisma.payment.count({
      where: { studentId: id, status: 'OVERDUE' },
    });

    // Get feedbacks count
    const feedbacksCount = await this.prisma.feedback.count({
      where: { studentId: id },
    });

    return {
      attendance: {
        total: totalAttendances,
        present: presentCount,
        absent: totalAttendances - presentCount,
        unjustifiedAbsences,
        rate: totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0,
      },
      payments: {
        pending: pendingPayments,
        overdue: overduePayments,
      },
      feedbacks: feedbacksCount,
    };
  }

  async getMyDashboard(userId: string) {
    const student = await this.findByUserId(userId);

    if (!student.groupId) {
      return {
        student,
        upcomingLessons: [],
        recentFeedbacks: [],
        pendingPayments: [],
        statistics: await this.getStatistics(student.id),
      };
    }

    // Get upcoming lessons
    const upcomingLessons = await this.prisma.lesson.findMany({
      where: {
        groupId: student.groupId,
        scheduledAt: { gte: new Date() },
        status: 'SCHEDULED',
      },
      take: 5,
      orderBy: { scheduledAt: 'asc' },
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Get recent feedbacks
    const recentFeedbacks = await this.prisma.feedback.findMany({
      where: { studentId: student.id },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: { select: { scheduledAt: true, topic: true } },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Get payment status
    const pendingPayments = await this.prisma.payment.findMany({
      where: { studentId: student.id, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
    });

    // Get attendance statistics
    const stats = await this.getStatistics(student.id);

    return {
      student,
      upcomingLessons,
      recentFeedbacks,
      pendingPayments,
      statistics: stats,
    };
  }
}
