import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import {
  FIXED_GROUP_MAX_STUDENTS,
  GROUP_CAPACITY_EXCEEDED_MESSAGE,
} from '../groups/group.constants';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { randomUUID } from 'crypto';
import { GroupChatSyncService } from '../groups/group-chat-sync.service';

@Injectable()
export class StudentGroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly chatSync: GroupChatSyncService,
  ) {}

  async changeGroup(id: string, newGroupId: string | null, user?: JwtPayload): Promise<unknown> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true },
        },
        group: {
          select: { centerId: true },
        },
      },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${id} not found`);
    }

    const oldGroupId = student.groupId;
    const managerCenterId = getManagerCenterIdOrThrow(user);

    if (
      managerCenterId &&
      student.group?.centerId !== managerCenterId &&
      student.centerId !== managerCenterId
    ) {
      throw new ForbiddenException('You do not have access to this student');
    }

    // Validate new group if provided and get teacherId for sync
    let newGroupTeacherId: string | null = null;
    if (newGroupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: newGroupId },
        include: { _count: { select: { students: true } } },
      });

      if (!group) {
        throw new BadRequestException(`Group with ID ${newGroupId} not found`);
      }

      if (managerCenterId && group.centerId !== managerCenterId) {
        throw new ForbiddenException('You can only move students to groups in your center');
      }

      if (group._count.students >= FIXED_GROUP_MAX_STUDENTS) {
        throw new BadRequestException(GROUP_CAPACITY_EXCEEDED_MESSAGE);
      }
      newGroupTeacherId = group.teacherId;
    }

    // Update student group and sync teacherId from the new group so Teacher → My Students shows the student immediately
    const updatePayload: { groupId: string | null; teacherId?: string | null } = {
      groupId: newGroupId,
      teacherId: newGroupId ? newGroupTeacherId : null,
    };
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: updatePayload,
      });

      if (oldGroupId !== newGroupId) {
        if (oldGroupId) {
          await tx.$executeRaw`
            UPDATE "student_group_histories"
            SET "leftAt" = ${now}, "updatedAt" = ${now}
            WHERE "studentId" = ${id} AND "leftAt" IS NULL
          `;
        }

        if (newGroupId) {
          await tx.$executeRaw`
            INSERT INTO "student_group_histories" ("id", "studentId", "groupId", "joinedAt", "createdAt", "updatedAt")
            VALUES (${randomUUID()}, ${id}, ${newGroupId}, ${now}, ${now}, ${now})
          `;
        }
      }
    });

    if (oldGroupId && oldGroupId !== newGroupId) {
      await this.chatSync.removeStudentFromGroupChat(oldGroupId, student.user.id);
    }

    if (newGroupId) {
      await this.chatSync.ensureStudentInGroupChat(newGroupId, student.user.id);

      // Automatically create 1:1 direct chat between Student and assigned Teacher (if group has teacher)
      const newGroup = await this.prisma.group.findUnique({
        where: { id: newGroupId },
        include: {
          teacher: {
            include: { user: { select: { id: true } } },
          },
        },
      });
      if (newGroup?.teacherId && newGroup.teacher?.user?.id) {
        const teacherUserId = newGroup.teacher.user.id;
        try {
          await this.chatService.createDirectChat(
            { participantIds: [teacherUserId] },
            student.user.id,
          );
        } catch {
          // Ignore errors (e.g. duplicate or validation); chat may already exist
        }
      }
    }

    // Return updated student with full details
    return this.prisma.student.findUnique({
      where: { id },
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
      },
    });
  }
}






