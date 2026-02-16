import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateChatDto, SendMessageDto, UpdateMessageDto } from './dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get all chats for current user
   */
  @Get()
  async getMyChats(@CurrentUser() user: JwtPayload) {
    return this.chatService.getUserChats(user.sub);
  }

  /**
   * Get chat by ID
   */
  @Get(':chatId')
  async getChatById(
    @Param('chatId') chatId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getChatById(chatId, user.sub, user.role);
  }

  /**
   * Get messages for a chat
   */
  @Get(':chatId/messages')
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('cursor') cursor: string,
    @Query('take') take: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getMessages(chatId, user.sub, {
      cursor,
      take: take ? parseInt(take, 10) : undefined,
    }, user.role);
  }

  /**
   * Create a new direct chat
   */
  @Post()
  async createChat(
    @Body() dto: CreateChatDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.createDirectChat(dto, user.sub);
  }

  /**
   * Send a message
   */
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.sendMessage(dto, user.sub, user.role);
  }

  /**
   * Edit a message
   */
  @Put('messages/:messageId')
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.editMessage(messageId, dto, user.sub);
  }

  /**
   * Delete a message
   */
  @Delete('messages/:messageId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.deleteMessage(messageId, user.sub);
  }

  /**
   * Mark chat as read
   */
  @Post(':chatId/read')
  async markAsRead(
    @Param('chatId') chatId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.markAsRead(chatId, user.sub);
  }

  /**
   * Send vocabulary (Teachers only)
   */
  @Post(':chatId/vocabulary')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async sendVocabulary(
    @Param('chatId') chatId: string,
    @Body('words') words: string[],
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.sendVocabularyMessage(chatId, user.sub, words);
  }

  /**
   * Get chat for a group
   */
  @Get('group/:groupId')
  async getGroupChat(
    @Param('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getGroupChat(groupId, user.sub, user.role);
  }

  /**
   * Get students list for admin chat (Admin only)
   */
  @Get('admin/students')
  @Roles(UserRole.ADMIN)
  async getAdminStudents(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    return this.chatService.getAdminStudents(user.sub, search);
  }

  /**
   * Get teachers list for admin chat (Admin only)
   */
  @Get('admin/teachers')
  @Roles(UserRole.ADMIN)
  async getAdminTeachers(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    return this.chatService.getAdminTeachers(user.sub, search);
  }

  /**
   * Get groups list for admin chat (Admin only)
   */
  @Get('admin/groups')
  @Roles(UserRole.ADMIN)
  async getAdminGroups(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    return this.chatService.getAdminGroups(user.sub, search);
  }

  /**
   * Get teacher's assigned groups (Teacher only)
   */
  @Get('teacher/groups')
  @Roles(UserRole.TEACHER)
  async getTeacherGroups(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    return this.chatService.getTeacherGroups(user.sub, search);
  }

  /**
   * Get teacher's assigned students (Teacher only)
   */
  @Get('teacher/students')
  @Roles(UserRole.TEACHER)
  async getTeacherStudents(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    return this.chatService.getTeacherStudents(user.sub, search);
  }

  /**
   * Get admin user info for Teacher Chat (Teacher only)
   */
  @Get('teacher/admin')
  @Roles(UserRole.TEACHER)
  async getAdminForTeacher(@CurrentUser() user: JwtPayload) {
    return this.chatService.getAdminForTeacher(user.sub);
  }
}


