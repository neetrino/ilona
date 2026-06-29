import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChatType, UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { getChatDb } from './chat-management.util';
import { JwtPayload } from '../../common/types/auth.types';

@Injectable()
export class ChatGroupProvisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly managerScope: ChatManagerScopeService,
  ) {}

  async provisionClassGroupChat(
    groupId: string,
    userId: string,
    userRole?: string,
    authUser?: JwtPayload,
  ): Promise<void> {
    const db = getChatDb(this.prisma);

    const group = await db.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        teacherId: true,
        isActive: true,
        centerId: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.isActive) {
      throw new BadRequestException('Group is not active');
    }

    const managerCenterId = this.managerScope.managerCenterIdFromJwt(authUser);
    const isAdminCreator = userRole === UserRole.ADMIN || userRole === 'ADMIN';
    const isManagerOwnCenter =
      (userRole === UserRole.MANAGER || userRole === 'MANAGER') &&
      !!managerCenterId &&
      group.centerId === managerCenterId;

    if (!isAdminCreator && !isManagerOwnCenter) {
      throw new ForbiddenException('Only administrators can create group chats');
    }

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const newChat = await db.chat.create({
      data: {
        type: ChatType.GROUP,
        name: group.name,
        groupId: group.id,
      },
    });

    await db.chatParticipant.create({
      data: {
        chatId: newChat.id,
        userId,
        isAdmin: true,
      },
    });

    if (group.teacherId) {
      const teacher = await db.teacher.findUnique({
        where: { id: group.teacherId },
        select: { userId: true },
      });
      if (teacher) {
        await db.chatParticipant.upsert({
          where: {
            chatId_userId: {
              chatId: newChat.id,
              userId: teacher.userId,
            },
          },
          update: { leftAt: null },
          create: {
            chatId: newChat.id,
            userId: teacher.userId,
            isAdmin: true,
          },
        });
      }
    }

    const students = await db.student.findMany({
      where: { groupId },
      select: { userId: true },
    });

    for (const student of students) {
      await db.chatParticipant.upsert({
        where: {
          chatId_userId: {
            chatId: newChat.id,
            userId: student.userId,
          },
        },
        update: {
          leftAt: null,
          isAdmin: false,
        },
        create: {
          chatId: newChat.id,
          userId: student.userId,
          isAdmin: false,
        },
      });
    }
  }
}
