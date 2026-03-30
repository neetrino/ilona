import { Injectable } from '@nestjs/common';
import { CreateChatDto, CreateCustomGroupChatDto, SendMessageDto, UpdateMessageDto } from './dto';
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
  async getUserChats(userId: string): Promise<unknown> {
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
  async getMessage(messageId: string): Promise<unknown> {
    return this.messageService.getMessage(messageId);
  }

  async getMessages(chatId: string, userId: string, params?: { cursor?: string; take?: number }, userRole?: string): Promise<unknown> {
    return this.messageService.getMessages(chatId, userId, params, userRole);
  }

  async sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string) {
    return this.messageService.sendMessage(dto, senderId, senderRole);
  }

  async editMessage(messageId: string, dto: UpdateMessageDto, userId: string): Promise<unknown> {
    return this.messageService.editMessage(messageId, dto, userId);
  }

  async deleteMessage(messageId: string, userId: string): Promise<unknown> {
    return this.messageService.deleteMessage(messageId, userId);
  }

  async markAsRead(chatId: string, userId: string) {
    return this.messageService.markAsRead(chatId, userId);
  }

  async sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]): Promise<unknown> {
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

  async getAdminAllUsers(adminId: string, search?: string) {
    return this.chatListsService.getAdminAllUsers(adminId, search);
  }

  async getAdminStudentRecordings(
    adminId: string,
    filters?: { groupId?: string; studentUserId?: string; search?: string },
  ) {
    return this.messageService.getAdminStudentRecordings(adminId, filters);
  }

  async getTeacherStudentRecordings(
    teacherUserId: string,
    filters?: { groupId?: string; studentUserId?: string; search?: string },
  ) {
    return this.messageService.getTeacherStudentRecordings(teacherUserId, filters);
  }

  async addGroupChatMember(groupId: string, userId: string, adminId: string) {
    return this.chatManagementService.addGroupChatMember(groupId, userId, adminId);
  }

  async createCustomGroupChat(adminId: string, dto: CreateCustomGroupChatDto) {
    return this.chatManagementService.createCustomGroupChat(adminId, dto);
  }

  async getCustomGroupChats(userId: string): Promise<unknown> {
    return this.chatManagementService.getCustomGroupChats(userId);
  }

  async addCustomGroupChatMember(chatId: string, userId: string, adminId: string) {
    return this.chatManagementService.addCustomGroupChatMember(chatId, userId, adminId);
  }

  async getTeacherGroups(teacherUserId: string, search?: string) {
    return this.chatListsService.getTeacherGroups(teacherUserId, search);
  }

  async getTeacherStudents(teacherUserId: string, search?: string): Promise<unknown> {
    return this.chatListsService.getTeacherStudents(teacherUserId, search);
  }

  async getAdminForTeacher(teacherUserId: string): Promise<unknown> {
    return this.chatListsService.getAdminForTeacher(teacherUserId);
  }

  async getAdminForStudent(studentUserId: string): Promise<unknown> {
    return this.chatListsService.getAdminForStudent(studentUserId);
  }

  async getStudentVoiceToTeacherRecordings(
    studentUserId: string,
    filters?: { year?: number; month?: number; day?: number },
  ) {
    return this.messageService.getStudentVoiceToTeacherRecordings(studentUserId, filters);
  }
}
