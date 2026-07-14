import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType, UserRole } from '@ilona/database';
import { UpdateMessageDto } from './dto';
import { StorageService } from '../storage/storage.service';
import { ChatManagementService } from './chat-management.service';
import { chatSenderPublicSelect, mapMessageWithSender } from './chat-message-sender.util';
import { JwtPayload } from '../../common/types/auth.types';
import { extractStorageKeyFromFileUrl } from './message-storage.util';

function canModerateChatMessages(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
}

@Injectable()
export class MessageMutationService {
  private readonly logger = new Logger(MessageMutationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly chatManagementService: ChatManagementService,
  ) {}

  async editMessage(
    messageId: string,
    dto: UpdateMessageDto,
    userId: string,
    authUser?: JwtPayload,
  ) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.chatManagementService.getChatById(
      message.chatId,
      userId,
      authUser?.role,
      authUser,
    );

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.type !== MessageType.TEXT) {
      throw new BadRequestException('Only text messages can be edited');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: chatSenderPublicSelect,
        },
      },
    });

    return mapMessageWithSender(updated);
  }

  async deleteMessage(messageId: string, userId: string, authUser?: JwtPayload) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.chatManagementService.getChatById(
      message.chatId,
      userId,
      authUser?.role,
      authUser,
    );

    const isOwner = message.senderId === userId;
    if (!isOwner && !canModerateChatMessages(authUser?.role)) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.fileUrl) {
      try {
        const key = extractStorageKeyFromFileUrl(message.fileUrl);
        if (key) {
          this.logger.log(
            `Deleting file from storage. Key: ${key}, Original URL: ${message.fileUrl}`,
          );
          await this.storageService
            .delete(key)
            .then(() => {
              this.logger.log(`Successfully deleted file from storage: ${key}`);
            })
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : String(err);
              this.logger.error(`Failed to delete file from storage. Key: ${key}, Error: ${msg}`);
            });
        } else {
          this.logger.warn(`Could not extract key from fileUrl: ${message.fileUrl}`);
        }
      } catch (error) {
        this.logger.error(
          `Error processing file deletion: ${error instanceof Error ? error.message : String(error)}, FileUrl: ${message.fileUrl}`,
        );
      }
    }

    return this.prisma.message.delete({ where: { id: messageId } });
  }

  async markAsRead(chatId: string, userId: string, authUser?: JwtPayload) {
    await this.chatManagementService.getChatById(chatId, userId, authUser?.role, authUser);

    await this.prisma.chatParticipant.updateMany({
      where: { chatId, userId },
      data: { lastReadAt: new Date() },
    });

    return { success: true };
  }

  async sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]) {
    if (!teacherId || teacherId.trim() === '') {
      this.logger.error('[sendVocabularyMessage] teacherId is missing or empty', { chatId });
      throw new BadRequestException('Teacher ID is required');
    }

    const teacherUser = await this.prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true, status: true, email: true },
    });

    if (!teacherUser) {
      this.logger.error('[sendVocabularyMessage] teacherId does not match any user', {
        teacherId,
        chatId,
      });
      throw new BadRequestException('Invalid teacher ID');
    }

    if (teacherUser.status !== 'ACTIVE') {
      this.logger.error('[sendVocabularyMessage] teacher user is not active', {
        teacherId,
        status: teacherUser.status,
      });
      throw new ForbiddenException('Teacher account is not active');
    }

    const chat = await this.chatManagementService.getChatById(chatId, teacherId, teacherUser.role);
    const participant = chat.participants.find((p) => p.userId === teacherId);

    if (!participant?.isAdmin) {
      throw new ForbiddenException('Only chat admins can send vocabulary');
    }

    return this.prisma.message.create({
      data: {
        chatId,
        senderId: teacherId,
        type: MessageType.TEXT,
        content: `📚 **Vocabulary for Today:**\n\n${vocabularyWords.map((word, i) => `${i + 1}. ${word}`).join('\n')}`,
        metadata: {
          isVocabulary: true,
          words: vocabularyWords,
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
