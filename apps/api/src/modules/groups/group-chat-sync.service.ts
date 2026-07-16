import { Injectable } from '@nestjs/common';
import { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class GroupChatSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroupChat(groupId: string, groupName: string, teacherIds?: string | string[]) {
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

  /**
   * Ensure the class group chat exists and the student is an active participant,
   * so the chat appears immediately in the student's chat list.
   */
  async ensureStudentInGroupChat(
    groupId: string,
    userId: string,
    db: DbClient = this.prisma,
  ): Promise<void> {
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        teacherId: true,
        secondTeacherId: true,
      },
    });
    if (!group) return;

    let chat = await db.chat.findUnique({ where: { groupId } });
    if (!chat) {
      chat = await db.chat.create({
        data: {
          type: 'GROUP',
          name: group.name,
          groupId,
        },
      });

      const teacherIds = [group.teacherId, group.secondTeacherId].filter(
        (id): id is string => Boolean(id),
      );
      for (const teacherId of teacherIds) {
        const teacher = await db.teacher.findUnique({
          where: { id: teacherId },
          select: { userId: true },
        });
        if (!teacher) continue;
        await db.chatParticipant.upsert({
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
    }

    await db.chatParticipant.upsert({
      where: {
        chatId_userId: { chatId: chat.id, userId },
      },
      update: { leftAt: null },
      create: {
        chatId: chat.id,
        userId,
        isAdmin: false,
      },
    });
  }

  async removeStudentFromGroupChat(
    groupId: string,
    userId: string,
    db: DbClient = this.prisma,
  ): Promise<void> {
    const chat = await db.chat.findUnique({
      where: { groupId },
      select: { id: true },
    });
    if (!chat) return;

    await db.chatParticipant.updateMany({
      where: { chatId: chat.id, userId },
      data: { leftAt: new Date() },
    });
  }

  async syncGroupTeachersInChat(
    groupId: string,
    groupName: string,
    teacherIds: Array<string | null | undefined>,
  ) {
    const uniqueTeacherIds = [...new Set(teacherIds.filter(Boolean))] as string[];
    if (uniqueTeacherIds.length === 0) return;

    const chat = await this.prisma.chat.findUnique({ where: { groupId } });
    if (!chat) {
      await this.createGroupChat(groupId, groupName, uniqueTeacherIds);
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

  async removeTeachersFromGroupChat(groupId: string, oldTeacherIds: Array<string | null | undefined>) {
    for (const oldId of oldTeacherIds.filter(Boolean) as string[]) {
      const oldTeacher = await this.prisma.teacher.findUnique({
        where: { id: oldId },
        select: { userId: true },
      });
      if (!oldTeacher) continue;
      const chat = await this.prisma.chat.findUnique({ where: { groupId } });
      if (!chat) continue;
      await this.prisma.chatParticipant.updateMany({
        where: { chatId: chat.id, userId: oldTeacher.userId },
        data: { leftAt: new Date() },
      });
    }
  }
}
