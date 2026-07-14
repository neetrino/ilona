import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChatType, UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import {
  ChatWithParticipantIds,
  ParticipantUserId,
  getChatDb,
} from './chat-management.util';

@Injectable()
export class ChatDirectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: ChatAuthorizationService,
    private readonly managerScope: ChatManagerScopeService,
  ) {}

  async createDirectChat(dto: CreateChatDto, creatorId: string) {
    const db = getChatDb(this.prisma);

    if (!dto.participantIds?.length) {
      throw new BadRequestException('At least one participant is required');
    }

    const creator = await db.user.findUnique({
      where: { id: creatorId },
      select: { role: true },
    });

    if (!creator) {
      throw new NotFoundException('User not found');
    }

    if (dto.participantIds.length === 1) {
      const participantId = dto.participantIds[0];
      const participant = await db.user.findUnique({
        where: { id: participantId },
        select: { role: true },
      });

      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const isAdminInvolved = creator.role === UserRole.ADMIN || participant.role === UserRole.ADMIN;

      let isManagerBranchDm = false;
      if (creator.role === UserRole.MANAGER) {
        isManagerBranchDm = await this.managerScope.canManagerDirectMessageUser(
          creatorId,
          participantId,
        );
      }
      if (participant.role === UserRole.MANAGER) {
        isManagerBranchDm =
          isManagerBranchDm ||
          (await this.managerScope.canManagerDirectMessageUser(participantId, creatorId));
      }

      if (!isAdminInvolved && !isManagerBranchDm) {
        if (creator.role === UserRole.STUDENT && participant.role === UserRole.TEACHER) {
          const canDM = await this.authorizationService.validateStudentTeacherDM(
            creatorId,
            participantId,
          );
          if (!canDM) {
            throw new ForbiddenException('You can only message teachers assigned to you');
          }
        }

        if (creator.role === UserRole.TEACHER && participant.role === UserRole.STUDENT) {
          const canDM = await this.authorizationService.validateStudentTeacherDM(
            participantId,
            creatorId,
          );
          if (!canDM) {
            throw new ForbiddenException('You can only message students assigned to you');
          }
        }
      }
    }

    if (dto.participantIds.length === 1) {
      const participantId = dto.participantIds[0];
      const userIds = [creatorId, participantId].sort();

      const chatsWithCreator = await db.chat.findMany({
        where: {
          type: ChatType.DIRECT,
          participants: {
            some: {
              userId: creatorId,
              leftAt: null,
            },
          },
        },
        include: {
          participants: {
            where: { leftAt: null },
            select: {
              userId: true,
            },
          },
        },
      });

      const existingChat = chatsWithCreator.find((chat: ChatWithParticipantIds) => {
        const participantUserIds = chat.participants.map((p: ParticipantUserId) => p.userId).sort();
        return (
          participantUserIds.length === 2 &&
          participantUserIds[0] === userIds[0] &&
          participantUserIds[1] === userIds[1]
        );
      });

      if (existingChat) {
        const fullChat = await db.chat.findUnique({
          where: { id: existingChat.id },
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
                    status: true,
                  },
                },
              },
            },
          },
        });

        if (!fullChat) {
          throw new NotFoundException('Chat not found');
        }

        return fullChat;
      }
    }

    const allParticipants = [...new Set([creatorId, ...dto.participantIds])];

    return db.chat.create({
      data: {
        type: ChatType.DIRECT,
        name: dto.name,
        participants: {
          create: allParticipants.map((userId, index) => ({
            userId,
            isAdmin: index === 0,
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
                status: true,
              },
            },
          },
        },
      },
    });
  }
}
