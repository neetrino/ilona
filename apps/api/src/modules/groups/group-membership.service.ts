import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import {
  FIXED_GROUP_MAX_STUDENTS,
  GROUP_CAPACITY_EXCEEDED_MESSAGE,
} from './group.constants';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { randomUUID } from 'crypto';
import { GroupAccessService } from './group-access.service';
import { GroupQueryService } from './group-query.service';

@Injectable()
export class GroupMembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly accessService: GroupAccessService,
    private readonly queryService: GroupQueryService,
  ) {}

  async assignTeacher(groupId: string, teacherId: string, currentUser?: JwtPayload) {
    await this.accessService.assertManagerGroupAccess(groupId, currentUser);
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

    return this.prisma.$transaction(async (tx) => {
      const existingGroup = await tx.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true, teacherId: true },
      });

      if (!existingGroup) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }

      const teacher = await tx.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true },
      });

      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${teacherId} not found`);
      }

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

      let chat = await tx.chat.findUnique({ where: { groupId } });

      if (!chat) {
        chat = await tx.chat.create({
          data: {
            type: 'GROUP',
            name: group.name,
            groupId,
          },
        });

        await tx.chatParticipant.create({
          data: {
            chatId: chat.id,
            userId: teacher.userId,
            isAdmin: true,
          },
        });
      } else {
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
    await this.queryService.findById(groupId, currentUser);
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);

    const currentCount = await this.prisma.student.count({ where: { groupId } });
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

    const chat = await this.prisma.chat.findUnique({ where: { groupId } });
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
    await this.accessService.assertManagerGroupAccess(groupId, currentUser);

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
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

    const chat = await this.prisma.chat.findUnique({ where: { groupId } });
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
}
