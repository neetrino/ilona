import { Injectable } from '@nestjs/common';
import { SendMessageDto, UpdateMessageDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { MessageQueryService } from './message-query.service';
import { MessageSendService } from './message-send.service';
import { MessageMutationService } from './message-mutation.service';
import { MessageRecordingService } from './message-recording.service';
import type { AdminStudentRecordingFilters, SendMessageResponse } from './message.types';

export type { SendMessageResponse, AdminStudentRecordingFilters } from './message.types';

/** Facade for message operations — delegates to domain-specific services. */
@Injectable()
export class MessageService {
  constructor(
    private readonly queryService: MessageQueryService,
    private readonly sendService: MessageSendService,
    private readonly mutationService: MessageMutationService,
    private readonly recordingService: MessageRecordingService,
  ) {}

  getMessage(messageId: string) {
    return this.queryService.getMessage(messageId);
  }

  getMessages(
    chatId: string,
    userId: string,
    params?: { cursor?: string; take?: number },
    userRole?: string,
    authUser?: JwtPayload,
  ) {
    return this.queryService.getMessages(chatId, userId, params, userRole, authUser);
  }

  sendMessage(
    dto: SendMessageDto,
    senderId: string,
    senderRole?: string,
    authUser?: JwtPayload,
  ): Promise<SendMessageResponse> {
    return this.sendService.sendMessage(dto, senderId, senderRole, authUser);
  }

  editMessage(messageId: string, dto: UpdateMessageDto, userId: string, authUser?: JwtPayload) {
    return this.mutationService.editMessage(messageId, dto, userId, authUser);
  }

  deleteMessage(messageId: string, userId: string, authUser?: JwtPayload) {
    return this.mutationService.deleteMessage(messageId, userId, authUser);
  }

  markAsRead(chatId: string, userId: string, authUser?: JwtPayload) {
    return this.mutationService.markAsRead(chatId, userId, authUser);
  }

  sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]) {
    return this.mutationService.sendVocabularyMessage(chatId, teacherId, vocabularyWords);
  }

  getStudentVoiceToTeacherRecordings(
    studentUserId: string,
    filters?: { year?: number; month?: number; day?: number },
  ) {
    return this.recordingService.getStudentVoiceToTeacherRecordings(studentUserId, filters);
  }

  getAdminStudentRecordings(
    adminUserId: string,
    filters?: AdminStudentRecordingFilters,
    branchCenterId?: string,
  ) {
    return this.recordingService.getAdminStudentRecordings(adminUserId, filters, branchCenterId);
  }

  getTeacherStudentRecordings(teacherUserId: string, filters?: AdminStudentRecordingFilters) {
    return this.recordingService.getTeacherStudentRecordings(teacherUserId, filters);
  }
}
