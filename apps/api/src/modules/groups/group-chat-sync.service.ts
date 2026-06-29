import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async syncGroupTeachersInChat(
    groupId: string,
    groupName: string,
    teacherIds: Array<string | null | undefined>,
  ) {
    const uniqueTeacherIds = [...new Set(teacherIds.filter(Boolean))] as string[];
    if (uniqueTeacherIds.length === 0) return;

    let chat = await this.prisma.chat.findUnique({ where: { groupId } });
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
