import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MessageType, ChatType, UserRole } from '@ilona/database';
import { SendMessageDto } from './dto';
import { SalariesService } from '../finance/salaries.service';
import { effectiveLessonInstructorTeacherId } from '../../common/lesson-instructor';
import { ChatManagementService } from './chat-management.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { ChatManagerScopeService } from './chat-manager-scope.service';
import { chatSenderPublicSelect, mapMessageWithSender } from './chat-message-sender.util';
import { JwtPayload } from '../../common/types/auth.types';
import type { SendMessageResponse } from './message.types';

@Injectable()
export class MessageSendService {
  private readonly logger = new Logger(MessageSendService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
    private readonly chatManagementService: ChatManagementService,
    private readonly authorizationService: ChatAuthorizationService,
    private readonly managerScope: ChatManagerScopeService,
  ) {}

  async sendMessage(
    dto: SendMessageDto,
    senderId: string,
    senderRole?: string,
    authUser?: JwtPayload,
  ): Promise<SendMessageResponse> {
    if (!senderId || senderId.trim() === '') {
      this.logger.error('[sendMessage] senderId is missing or empty', { dto });
      throw new BadRequestException('Sender ID is required');
    }

    const senderUser = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, role: true, status: true, email: true },
    });

    if (!senderUser) {
      this.logger.error('[sendMessage] senderId does not match any user', { senderId, dto });
      throw new BadRequestException('Invalid sender ID');
    }

    if (senderUser.status !== 'ACTIVE') {
      this.logger.error('[sendMessage] sender user is not active', {
        senderId,
        status: senderUser.status,
      });
      throw new ForbiddenException('Sender account is not active');
    }

    if (senderRole && senderUser.role !== senderRole) {
      this.logger.error('[sendMessage] senderRole mismatch - potential security issue', {
        senderId,
        providedRole: senderRole,
        actualRole: senderUser.role,
        email: senderUser.email,
      });
      throw new ForbiddenException('Sender role mismatch');
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug('[sendMessage] Creating message', {
        senderId,
        senderRole: senderUser.role,
        senderEmail: senderUser.email,
        chatId: dto.chatId,
      });
    }

    const chat = await this.chatManagementService.getChatById(
      dto.chatId,
      senderId,
      senderUser.role,
      authUser,
    );

    const messageType = dto.type || MessageType.TEXT;
    if (messageType === MessageType.VOICE) {
      if (!dto.fileUrl || typeof dto.fileUrl !== 'string' || !dto.fileUrl.trim()) {
        throw new BadRequestException('Voice messages require an audio file URL');
      }
      const duration = dto.duration ?? 0;
      if (duration < 1 || duration > 600) {
        throw new BadRequestException('Voice message duration must be between 1 and 600 seconds');
      }
      const maxVoiceSizeBytes = 10 * 1024 * 1024;
      if (dto.fileSize != null && dto.fileSize > maxVoiceSizeBytes) {
        throw new BadRequestException('Voice message file size exceeds the maximum allowed (10MB)');
      }
    }

    const metadataObj = dto.metadata && typeof dto.metadata === 'object' ? dto.metadata : null;
    if (metadataObj?.voiceToTeacher === true) {
      if (senderUser.role !== UserRole.STUDENT) {
        throw new ForbiddenException('Only students can send voice messages to teacher');
      }
      if (chat.type !== ChatType.DIRECT) {
        throw new BadRequestException(
          'Voice to teacher can only be sent in a direct chat with your teacher',
        );
      }
      const otherParticipantForVoice = chat.participants.find((p) => p.userId !== senderId);
      const otherUserForVoice = otherParticipantForVoice
        ? await this.prisma.user.findUnique({
            where: { id: otherParticipantForVoice.userId },
            select: { role: true },
          })
        : null;
      if (otherUserForVoice?.role !== UserRole.TEACHER) {
        throw new BadRequestException('Voice to teacher must be sent to your assigned teacher');
      }
    }

    if (chat.type === ChatType.DIRECT) {
      const sender = senderUser;
      const otherParticipant = chat.participants.find((p) => p.userId !== senderId);
      if (otherParticipant) {
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherParticipant.userId },
          select: { role: true },
        });

        const isAdminInvolved =
          sender.role === UserRole.ADMIN || otherUser?.role === UserRole.ADMIN;

        let isManagerBranchDm = false;
        if (sender.role === UserRole.MANAGER && otherParticipant) {
          isManagerBranchDm = await this.managerScope.canManagerDirectMessageUser(
            senderId,
            otherParticipant.userId,
          );
        }
        if (otherUser?.role === UserRole.MANAGER && otherParticipant) {
          isManagerBranchDm =
            isManagerBranchDm ||
            (await this.managerScope.canManagerDirectMessageUser(
              otherParticipant.userId,
              senderId,
            ));
        }

        if (!isAdminInvolved && !isManagerBranchDm) {
          if (sender.role === UserRole.STUDENT && otherUser?.role === UserRole.TEACHER) {
            const canDM = await this.authorizationService.validateStudentTeacherDM(
              senderId,
              otherParticipant.userId,
            );
            if (!canDM) {
              throw new ForbiddenException('You can only message teachers assigned to you');
            }
          }

          if (sender.role === UserRole.TEACHER && otherUser?.role === UserRole.STUDENT) {
            const canDM = await this.authorizationService.validateStudentTeacherDM(
              otherParticipant.userId,
              senderId,
            );
            if (!canDM) {
              throw new ForbiddenException('You can only message students assigned to you');
            }
          }
        }
      }
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        senderId,
        type: messageType,
        content: dto.content,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        duration: dto.duration,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
      include: {
        sender: {
          select: chatSenderPublicSelect,
        },
      },
    });

    await this.prisma.chat.update({
      where: { id: dto.chatId },
      data: { updatedAt: new Date() },
    });

    await this.syncLessonObligations(dto, messageType);

    const response: SendMessageResponse = {
      ...mapMessageWithSender(message),
      ...(chat.groupId && {
        navigation: {
          conversationId: chat.id,
          groupId: chat.groupId,
          messageId: message.id,
        },
      }),
    };
    return response;
  }

  private async syncLessonObligations(dto: SendMessageDto, messageType: MessageType) {
    if (!dto.metadata || typeof dto.metadata !== 'object' || !('lessonId' in dto.metadata)) {
      return;
    }

    const lessonId = dto.metadata.lessonId as string;

    if (messageType === MessageType.VOICE) {
      const lesson = await this.prisma.lesson
        .findUnique({
          where: { id: lessonId },
          select: {
            teacherId: true,
            substituteTeacherId: true,
            scheduledAt: true,
            voiceSent: true,
          },
        })
        .catch(() => null);

      if (lesson && !lesson.voiceSent) {
        await this.prisma.lesson
          .update({
            where: { id: lessonId },
            data: { voiceSent: true, voiceSentAt: new Date() },
          })
          .catch(() => {});

        if (lesson.scheduledAt) {
          const lessonMonth = new Date(lesson.scheduledAt);
          await this.salariesService
            .recalculateSalaryForMonth(effectiveLessonInstructorTeacherId(lesson), lessonMonth)
            .catch(() => {});
        }
      }
    } else if (messageType === MessageType.TEXT && dto.metadata.fromLessonDetail) {
      const lesson = await this.prisma.lesson
        .findUnique({
          where: { id: lessonId },
          select: {
            teacherId: true,
            substituteTeacherId: true,
            scheduledAt: true,
            textSent: true,
          },
        })
        .catch(() => null);

      if (lesson && !lesson.textSent) {
        await this.prisma.lesson
          .update({
            where: { id: lessonId },
            data: { textSent: true, textSentAt: new Date() },
          })
          .catch(() => {});

        if (lesson.scheduledAt) {
          const lessonMonth = new Date(lesson.scheduledAt);
          await this.salariesService
            .recalculateSalaryForMonth(effectiveLessonInstructorTeacherId(lesson), lessonMonth)
            .catch(() => {});
        }
      }
    }
  }
}
