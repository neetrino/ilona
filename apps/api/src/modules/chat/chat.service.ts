import { Injectable } from '@nestjs/common';
import { CreateChatDto, SendMessageDto, UpdateMessageDto } from './dto';
import { ChatManagementService } from './chat-management.service';
import { MessageService } from './message.service';
import { ChatListsService } from './chat-lists.service';

/**
 * Main Chat Service - Facade that delegates to specialized services
 * This maintains backward compatibility while keeping the codebase organized
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly chatManagementService: ChatManagementService,
    private readonly messageService: MessageService,
    private readonly chatListsService: ChatListsService,
  ) {}

  // Chat Management Methods
  async getUserChats(userId: string) {
    return this.chatManagementService.getUserChats(userId);
  }

  async getChatById(chatId: string, userId: string, userRole?: string) {
    return this.chatManagementService.getChatById(chatId, userId, userRole);
  }

  async createDirectChat(dto: CreateChatDto, creatorId: string) {
    return this.chatManagementService.createDirectChat(dto, creatorId);
  }

  async getGroupChat(groupId: string, userId?: string, userRole?: string) {
    return this.chatManagementService.getGroupChat(groupId, userId, userRole);
  }

  async getOrCreateGroupConversation(groupId: string, userId: string, userRole?: string) {
    return this.chatManagementService.getOrCreateGroupConversation(groupId, userId, userRole);
  }

  getOnlineUsers(chatId: string, onlineUserIds: Set<string>): string[] {
    return this.chatManagementService.getOnlineUsers(chatId, onlineUserIds);
  }

  // Message Methods
  async getMessage(messageId: string) {
    return this.messageService.getMessage(messageId);
  }

  async getMessages(chatId: string, userId: string, params?: { cursor?: string; take?: number }, userRole?: string) {
    return this.messageService.getMessages(chatId, userId, params, userRole);
  }

  async sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string) {
    return this.messageService.sendMessage(dto, senderId, senderRole);
  }

  async editMessage(messageId: string, dto: UpdateMessageDto, userId: string) {
    return this.messageService.editMessage(messageId, dto, userId);
  }

  async deleteMessage(messageId: string, userId: string) {
    return this.messageService.deleteMessage(messageId, userId);
  }

  async markAsRead(chatId: string, userId: string) {
    return this.messageService.markAsRead(chatId, userId);
  }

  async sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]) {
    return this.messageService.sendVocabularyMessage(chatId, teacherId, vocabularyWords);
  }

  // Chat Lists Methods
  async getAdminStudents(adminId: string, search?: string) {
    return this.chatListsService.getAdminStudents(adminId, search);
  }

  async getAdminTeachers(adminId: string, search?: string) {
    return this.chatListsService.getAdminTeachers(adminId, search);
  }

  async getAdminGroups(adminId: string, search?: string) {
    return this.chatListsService.getAdminGroups(adminId, search);
  }

  async getTeacherGroups(teacherUserId: string, search?: string) {
    return this.chatListsService.getTeacherGroups(teacherUserId, search);
  }

  async getTeacherStudents(teacherUserId: string, search?: string) {
    return this.chatListsService.getTeacherStudents(teacherUserId, search);
  }

  async getAdminForTeacher(teacherUserId: string) {
    return this.chatListsService.getAdminForTeacher(teacherUserId);
  }

  async getAdminForStudent(studentUserId: string) {
    return this.chatListsService.getAdminForStudent(studentUserId);
  }
}
