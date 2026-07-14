import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ChatType, UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { CHAT_DETAIL_GROUP_INCLUDE, getChatDb } from './chat-management.util';
import { JwtPayload } from '../../common/types/auth.types';

@Injectable()
export class ChatDetailService {
  private readonly logger = new Logger(ChatDetailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: ChatAuthorizationService,
    private readonly managerScope: ChatManagerScopeService,
  ) {}

  async getChatById(
    chatId: string,
    userId: string,
    userRole?: string,
    authUser?: JwtPayload,
  ): Promise<{
    id: string;
    type: ChatType;
    name: string | null;
    groupId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    group: {
      id: string;
      name: string;
      level: string | null;
      center: {
        id: string;
        name: string;
      } | null;
      teacherId: string | null;
      teacher: { userId: string } | null;
    } | null;
    participants: Array<{
      id: string;
      chatId: string;
      userId: string;
      isAdmin: boolean;
      joinedAt: Date;
      leftAt: Date | null;
      lastReadAt: Date | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: string;
        status: string | null;
        lastSeenAt: Date | null;
      };
    }>;
  }> {
    const db = getChatDb(this.prisma);
    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: CHAT_DETAIL_GROUP_INCLUDE,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = chat.participants.some((p) => p.userId === userId);

    const managerCenterId = this.managerScope.managerCenterIdFromJwt(authUser);
    const isAdminGroupSurface =
      (userRole === UserRole.ADMIN || userRole === 'ADMIN') && chat.type === ChatType.GROUP;
    const isManagerClassGroupSurface =
      (userRole === UserRole.MANAGER || userRole === 'MANAGER') &&
      chat.type === ChatType.GROUP &&
      !!chat.groupId &&
      !!managerCenterId &&
      chat.group?.center?.id === managerCenterId;

    const canOpenGroupWithoutMembershipYet = isAdminGroupSurface || isManagerClassGroupSurface;

    if (!isParticipant && !canOpenGroupWithoutMembershipYet) {
      if (
        (userRole === UserRole.TEACHER || userRole === 'TEACHER') &&
        chat.type === ChatType.GROUP &&
        chat.groupId
      ) {
        const accessCheck = await this.authorizationService.canTeacherAccessGroupChat(
          userId,
          chat.groupId,
        );

        if (accessCheck.hasAccess) {
          await this.authorizationService.ensureTeacherInGroupChat(chat.id, userId);
          return this.getChatById(chatId, userId, userRole, authUser);
        }

        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            `[403] Teacher denied access to group chat (getChatById). ` +
              `userId: ${userId}, chatId: ${chatId}, groupId: ${chat.groupId}, ` +
              `teacherId: ${accessCheck.debug?.teacherId || 'N/A'}, ` +
              `groupTeacherId: ${accessCheck.debug?.groupTeacherId || 'N/A'}, ` +
              `hasLessons: ${accessCheck.debug?.hasLessons || false}, ` +
              `hasSubstituteLessons: ${accessCheck.debug?.hasSubstituteLessons || false}`,
          );
        }
        throw new ForbiddenException('You are not assigned to this group');
      }

      if ((userRole === UserRole.TEACHER || userRole === 'TEACHER') && chat.type === ChatType.DIRECT) {
        const otherParticipant = chat.participants.find((p) => p.userId !== userId);
        if (otherParticipant) {
          const otherUser = await db.user.findUnique({
            where: { id: otherParticipant.userId },
            select: { role: true },
          });

          if (otherUser?.role === 'STUDENT') {
            const canAccess = await this.authorizationService.validateStudentTeacherDM(
              otherParticipant.userId,
              userId,
            );
            if (canAccess) {
              if (!isParticipant) {
                await db.chatParticipant.upsert({
                  where: {
                    chatId_userId: {
                      chatId: chat.id,
                      userId,
                    },
                  },
                  update: {
                    leftAt: null,
                  },
                  create: {
                    chatId: chat.id,
                    userId,
                    isAdmin: false,
                  },
                });

                return this.getChatById(chatId, userId, userRole, authUser);
              }
              return chat;
            }
          }
        }
      }

      throw new ForbiddenException('You are not a participant of this chat');
    }

    const canElevateIntoClassGroup =
      !!chat.groupId &&
      !isParticipant &&
      ((userRole === UserRole.ADMIN || userRole === 'ADMIN') || isManagerClassGroupSurface);

    if (canElevateIntoClassGroup) {
      await db.chatParticipant.upsert({
        where: {
          chatId_userId: {
            chatId: chat.id,
            userId,
          },
        },
        update: {
          leftAt: null,
        },
        create: {
          chatId: chat.id,
          userId,
          isAdmin: true,
        },
      });

      return this.getChatById(chatId, userId, userRole, authUser);
    }

    if (chat.type === ChatType.GROUP && !chat.groupId && !isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    if (
      (userRole === UserRole.MANAGER || userRole === 'MANAGER') &&
      managerCenterId &&
      isParticipant
    ) {
      await this.managerScope.assertManagerCanAccessChat(
        {
          id: chat.id,
          type: chat.type,
          groupId: chat.groupId,
          group: chat.group
            ? { center: chat.group.center ? { id: chat.group.center.id } : null }
            : null,
          participants: chat.participants.map((p) => ({ userId: p.userId })),
        },
        userId,
        managerCenterId,
      );
    }

    return chat;
  }
}
