import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async changeGroup(id: string, newGroupId: string | null) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${id} not found`);
    }

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




