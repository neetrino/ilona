import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ChatType, UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { ChatGroupProvisionService } from './chat-group-provision.service';
import { CHAT_GROUP_INCLUDE, ParticipantUserId, getChatDb } from './chat-management.util';
import { JwtPayload } from '../../common/types/auth.types';

@Injectable()
export class ChatGroupConversationService {
  private readonly logger = new Logger(ChatGroupConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: ChatAuthorizationService,
    private readonly managerScope: ChatManagerScopeService,
    private readonly groupProvision: ChatGroupProvisionService,
  ) {}

  async getOrCreateGroupConversation(
    groupId: string,
    userId: string,
    userRole?: string,
    authUser?: JwtPayload,
  ) {
    return this.getGroupChat(groupId, userId, userRole, authUser);
  }

  async getGroupChat(
    groupId: string,
    userId?: string,
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
      };
    }>;
  }> {
    const db = getChatDb(this.prisma);
    const chat = await db.chat.findUnique({
      where: { groupId },
      include: CHAT_GROUP_INCLUDE,
    });

    if (!chat) {
      await this.groupProvision.provisionClassGroupChat(groupId, userId!, userRole, authUser);
      return this.getGroupChat(groupId, userId, userRole, authUser);
    }

    if (userId) {
      const isParticipant = chat.participants.some((p: ParticipantUserId) => p.userId === userId);
      if (isParticipant) {
        const managerCenterForParticipant = this.managerScope.managerCenterIdFromJwt(authUser);
        if (
          (userRole === UserRole.MANAGER || userRole === 'MANAGER') &&
          managerCenterForParticipant
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
            managerCenterForParticipant,
          );
        }
        return chat;
      }
    }

    const managerCenterForElevate = this.managerScope.managerCenterIdFromJwt(authUser);
    const managerCanElevate =
      (userRole === UserRole.MANAGER || userRole === 'MANAGER') &&
      !!managerCenterForElevate &&
      chat.group?.center?.id === managerCenterForElevate;

    if (userId && (userRole === UserRole.ADMIN || managerCanElevate)) {
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

      return this.getGroupChat(groupId, userId, userRole, authUser);
    }

    if (userId && (userRole === UserRole.TEACHER || userRole === 'TEACHER')) {
      const accessCheck = await this.authorizationService.canTeacherAccessGroupChat(userId, groupId);

      if (accessCheck.hasAccess) {
        await this.authorizationService.ensureTeacherInGroupChat(chat.id, userId);
        return this.getGroupChat(groupId, userId, userRole, authUser);
      }

      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[403] Teacher denied access to group chat. ` +
            `userId: ${userId}, groupId: ${groupId}, ` +
            `teacherId: ${accessCheck.debug?.teacherId || 'N/A'}, ` +
            `groupTeacherId: ${accessCheck.debug?.groupTeacherId || 'N/A'}, ` +
            `hasLessons: ${accessCheck.debug?.hasLessons || false}, ` +
            `hasSubstituteLessons: ${accessCheck.debug?.hasSubstituteLessons || false}`,
        );
      }
      throw new ForbiddenException('You are not assigned to this group');
    }

    if (userId && userRole === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: {
          userId,
          groupId,
        },
        select: { id: true },
      });

      if (student) {
        await db.chatParticipant.upsert({
          where: {
            chatId_userId: {
              chatId: chat.id,
              userId,
            },
          },
          update: {
            leftAt: null,
            isAdmin: false,
          },
          create: {
            chatId: chat.id,
            userId,
            isAdmin: false,
          },
        });

        return this.getGroupChat(groupId, userId, userRole, authUser);
      }

      throw new ForbiddenException('You are not assigned to this group');
    }

    if (userId) {
      throw new ForbiddenException('You are not authorized to access this group chat');
    }

    return chat;
  }

  async addGroupChatMember(
    groupId: string,
    userId: string,
    actor: JwtPayload,
  ): Promise<{ chatId: string; participant: { userId: string; joinedAt: Date } }> {
    const db = getChatDb(this.prisma);

    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { centerId: true },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (actor.role === UserRole.MANAGER) {
      const centerId = this.managerScope.managerCenterIdFromJwt(actor);
      if (!centerId || group.centerId !== centerId) {
        throw new ForbiddenException('You cannot modify chats outside your branch');
      }
      const allowed = await this.managerScope.isUserInManagerBranch(userId, centerId);
      if (!allowed) {
        throw new ForbiddenException('User is not part of your branch');
      }
    }

    const chat = await db.chat.findUnique({
      where: { groupId },
      select: { id: true },
    });
    if (!chat) {
      throw new NotFoundException('Group chat not found. Open the group chat first.');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot add inactive or suspended users to the group');
    }

    const existing = await db.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: chat.id, userId },
      },
      select: { leftAt: true },
    });
    if (existing && existing.leftAt === null) {
      throw new BadRequestException('User is already a member of this group');
    }

    const participant = await db.chatParticipant.upsert({
      where: {
        chatId_userId: { chatId: chat.id, userId },
      },
      update: { leftAt: null },
      create: {
        chatId: chat.id,
        userId,
        isAdmin: false,
      },
      select: { userId: true, joinedAt: true },
    });

    return {
      chatId: chat.id,
      participant: { userId: participant.userId, joinedAt: participant.joinedAt },
    };
  }
}
