import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChatType, UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomGroupChatDto } from './dto';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { getChatDb } from './chat-management.util';
import { JwtPayload } from '../../common/types/auth.types';

@Injectable()
export class ChatCustomGroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly managerScope: ChatManagerScopeService,
  ) {}

  async getCustomGroupChats(userId: string, authUser?: JwtPayload): Promise<unknown> {
    const db = getChatDb(this.prisma);

    const chats = await db.chat.findMany({
      where: {
        type: ChatType.GROUP,
        groupId: null,
        isActive: true,
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: {
            NOT: {
              AND: [{ content: null }, { isSystem: true }],
            },
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const managerCenterId = this.managerScope.managerCenterIdFromJwt(authUser);
    if (managerCenterId && authUser?.role === UserRole.MANAGER) {
      const scoped = [];
      for (const c of chats) {
        const ok = await this.managerScope.isChatInManagerBranch(
          {
            id: c.id,
            type: c.type,
            groupId: c.groupId,
            group: null,
            participants: c.participants.map((p: { userId: string }) => ({ userId: p.userId })),
          },
          userId,
          managerCenterId,
        );
        if (ok) {
          scoped.push(c);
        }
      }
      return scoped;
    }

    return chats;
  }

  async createCustomGroupChat(creatorId: string, dto: CreateCustomGroupChatDto, actor: JwtPayload) {
    const db = getChatDb(this.prisma);
    const participantIds = (dto.participantIds ?? []).filter((id) => id !== creatorId);
    const allUserIds = [creatorId, ...participantIds];
    const uniqueIds = [...new Set(allUserIds)];

    for (const uid of uniqueIds) {
      const u = await db.user.findUnique({
        where: { id: uid },
        select: { id: true, status: true },
      });
      if (!u) {
        throw new NotFoundException(`User not found: ${uid}`);
      }
      if (u.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot add inactive or suspended users to the group');
      }
    }

    if (actor.role === UserRole.MANAGER) {
      const centerId = this.managerScope.managerCenterIdFromJwt(actor);
      if (!centerId) {
        throw new ForbiddenException('Manager account is not assigned to a center');
      }
      for (const uid of uniqueIds) {
        const allowed = await this.managerScope.isUserInManagerBranch(uid, centerId);
        if (!allowed) {
          throw new ForbiddenException('All participants must belong to your branch');
        }
      }
    }

    return db.chat.create({
      data: {
        type: ChatType.GROUP,
        name: dto.name.trim(),
        groupId: null,
        participants: {
          create: uniqueIds.map((userId) => ({
            userId,
            isAdmin: userId === creatorId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async addCustomGroupChatMember(
    chatId: string,
    userId: string,
    actor: JwtPayload,
  ): Promise<{ chatId: string; participant: { userId: string; joinedAt: Date } }> {
    const db = getChatDb(this.prisma);

    const chat = await db.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, groupId: true },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (chat.type !== ChatType.GROUP || chat.groupId !== null) {
      throw new BadRequestException('This endpoint is only for custom group chats');
    }

    if (actor.role === UserRole.MANAGER) {
      const centerId = this.managerScope.managerCenterIdFromJwt(actor);
      if (!centerId) {
        throw new ForbiddenException('Manager account is not assigned to a center');
      }
      const full = await db.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: { where: { leftAt: null }, select: { userId: true } },
        },
      });
      if (!full) {
        throw new NotFoundException('Chat not found');
      }
      const isMember = full.participants.some((p) => p.userId === actor.sub);
      if (!isMember) {
        throw new ForbiddenException('You are not a participant of this chat');
      }
      const allowed = await this.managerScope.isUserInManagerBranch(userId, centerId);
      if (!allowed) {
        throw new ForbiddenException('User is not part of your branch');
      }
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
        chatId_userId: { chatId, userId },
      },
      select: { leftAt: true },
    });
    if (existing && existing.leftAt === null) {
      throw new BadRequestException('User is already a member of this group');
    }

    const participant = await db.chatParticipant.upsert({
      where: {
        chatId_userId: { chatId, userId },
      },
      update: { leftAt: null },
      create: {
        chatId,
        userId,
        isAdmin: false,
      },
      select: { userId: true, joinedAt: true },
    });

    return {
      chatId,
      participant: { userId: participant.userId, joinedAt: participant.joinedAt },
    };
  }
}
