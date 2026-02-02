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
    return this.chatService.getChatById(chatId, user.sub);
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
    });
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
    return this.chatService.sendMessage(dto, user.sub);
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
  async getGroupChat(@Param('groupId') groupId: string) {
    return this.chatService.getGroupChat(groupId);
  }
}


