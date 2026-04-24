import { Injectable } from '@nestjs/common';
import { CreateChatDto, CreateCustomGroupChatDto, SendMessageDto, UpdateMessageDto } from './dto';
import { ChatManagementService } from './chat-management.service';
import { MessageService, type AdminStudentRecordingFilters } from './message.service';
import { ChatListsService } from './chat-lists.service';
import { JwtPayload } from '../../common/types/auth.types';

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
  async getUserChats(userId: string, authUser?: JwtPayload): Promise<unknown> {
    return this.chatManagementService.getUserChats(userId, authUser);
  }

  async getChatById(chatId: string, userId: string, userRole?: string, authUser?: JwtPayload) {
    return this.chatManagementService.getChatById(chatId, userId, userRole, authUser);
  }

  async createDirectChat(dto: CreateChatDto, creatorId: string) {
    return this.chatManagementService.createDirectChat(dto, creatorId);
  }

  async getGroupChat(groupId: string, userId?: string, userRole?: string, authUser?: JwtPayload) {
    return this.chatManagementService.getGroupChat(groupId, userId, userRole, authUser);
  }

  async getOrCreateGroupConversation(groupId: string, userId: string, userRole?: string, authUser?: JwtPayload) {
    return this.chatManagementService.getOrCreateGroupConversation(groupId, userId, userRole, authUser);
  }

  getOnlineUsers(chatId: string, onlineUserIds: Set<string>): string[] {
    return this.chatManagementService.getOnlineUsers(chatId, onlineUserIds);
  }

  // Message Methods
  async getMessage(messageId: string): Promise<unknown> {
    return this.messageService.getMessage(messageId);
  }

  async getMessages(
    chatId: string,
    userId: string,
    params?: { cursor?: string; take?: number },
    userRole?: string,
    authUser?: JwtPayload,
  ): Promise<unknown> {
    return this.messageService.getMessages(chatId, userId, params, userRole, authUser);
  }

  async sendMessage(dto: SendMessageDto, senderId: string, senderRole?: string, authUser?: JwtPayload) {
    return this.messageService.sendMessage(dto, senderId, senderRole, authUser);
  }

  async editMessage(messageId: string, dto: UpdateMessageDto, userId: string, authUser?: JwtPayload): Promise<unknown> {
    return this.messageService.editMessage(messageId, dto, userId, authUser);
  }

  async deleteMessage(messageId: string, userId: string, authUser?: JwtPayload): Promise<unknown> {
    return this.messageService.deleteMessage(messageId, userId, authUser);
  }

  async markAsRead(chatId: string, userId: string, authUser?: JwtPayload) {
    return this.messageService.markAsRead(chatId, userId, authUser);
  }

  async sendVocabularyMessage(chatId: string, teacherId: string, vocabularyWords: string[]): Promise<unknown> {
    return this.messageService.sendVocabularyMessage(chatId, teacherId, vocabularyWords);
  }

  // Chat Lists Methods
  async getAdminStudents(adminId: string, search?: string, branchCenterId?: string) {
    return this.chatListsService.getAdminStudents(adminId, search, branchCenterId);
  }

  async getAdminTeachers(adminId: string, search?: string, branchCenterId?: string) {
    return this.chatListsService.getAdminTeachers(adminId, search, branchCenterId);
  }

  async getAdminGroups(adminId: string, search?: string, branchCenterId?: string) {
    return this.chatListsService.getAdminGroups(adminId, search, branchCenterId);
  }

  async getAdminAllUsers(adminId: string, search?: string, branchCenterId?: string) {
    return this.chatListsService.getAdminAllUsers(adminId, search, branchCenterId);
  }

  async getAdminStudentRecordings(
    adminId: string,
    filters?: AdminStudentRecordingFilters,
    branchCenterId?: string,
  ) {
    return this.messageService.getAdminStudentRecordings(adminId, filters, branchCenterId);
  }

  async getTeacherStudentRecordings(
    teacherUserId: string,
    filters?: { groupId?: string; studentUserId?: string; search?: string },
  ) {
    return this.messageService.getTeacherStudentRecordings(teacherUserId, filters);
  }

  async addGroupChatMember(groupId: string, userId: string, actor: JwtPayload) {
    return this.chatManagementService.addGroupChatMember(groupId, userId, actor);
  }

  async createCustomGroupChat(creatorId: string, dto: CreateCustomGroupChatDto, actor: JwtPayload) {
    return this.chatManagementService.createCustomGroupChat(creatorId, dto, actor);
  }

  async getCustomGroupChats(userId: string, authUser?: JwtPayload): Promise<unknown> {
    return this.chatManagementService.getCustomGroupChats(userId, authUser);
  }

  async addCustomGroupChatMember(chatId: string, userId: string, actor: JwtPayload) {
    return this.chatManagementService.addCustomGroupChatMember(chatId, userId, actor);
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
