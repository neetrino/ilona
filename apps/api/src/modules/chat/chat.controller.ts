import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { CreateChatDto, SendMessageDto, UpdateMessageDto, AddGroupMemberDto, CreateCustomGroupChatDto } from './dto';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Get all chats for current user
   */
  @Get()
  async getMyChats(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.chatService.getUserChats(user.sub, user);
  }

  /**
   * Create a custom group chat (standalone, not linked to class groups). Admin only.
   */
  @Post('custom-groups')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createCustomGroupChat(
    @Body() dto: CreateCustomGroupChatDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.createCustomGroupChat(user.sub, dto, user);
  }

  /**
   * List custom group chats the current user belongs to.
   */
  @Get('custom-groups')
  async getCustomGroupChats(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.chatService.getCustomGroupChats(user.sub, user);
  }

  /**
   * Add a member to a custom group chat. Admin only.
   */
  @Post('custom-groups/:chatId/members')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addCustomGroupChatMember(
    @Param('chatId') chatId: string,
    @Body() dto: AddGroupMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.addCustomGroupChatMember(chatId, dto.userId, user);
  }

  /**
   * Get chat by ID
   */
  @Get(':chatId')
  async getChatById(
    @Param('chatId') chatId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getChatById(chatId, user.sub, user.role, user);
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
  ): Promise<unknown> {
    return this.chatService.getMessages(chatId, user.sub, {
      cursor,
      take: take ? parseInt(take, 10) : undefined,
    }, user.role, user);
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
   * Send a message.
   * SECURITY: Sender identity is derived ONLY from the authenticated user (JWT).
   * Never use senderId from request body - it is ignored if present.
   */
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // CRITICAL: Validate user context is present (per-request auth, no cached/global user)
    if (!user || !user.sub) {
      throw new UnauthorizedException('Authentication required');
    }

    // Sender is ALWAYS the authenticated user - never from dto
    const senderIdFromAuth = user.sub;
    const senderRoleFromAuth = user.role;

    // CRITICAL: Log sender identity for debugging (dev only)
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        JSON.stringify({ message: 'sendMessage', senderId: senderIdFromAuth, senderRole: senderRoleFromAuth, chatId: dto.chatId }),
      );
    }

    const message = await this.chatService.sendMessage(dto, senderIdFromAuth, senderRoleFromAuth, user);

    // Broadcast to all chat participants (including sender's other devices) so voice messages appear in real time
    this.chatGateway.broadcastNewMessage(dto.chatId, message);

    return message;
  }

  /**
   * Edit a message
   */
  @Put('messages/:messageId')
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.chatService.editMessage(messageId, dto, user.sub, user);
  }

  /**
   * Delete a message
   */
  @Delete('messages/:messageId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.chatService.deleteMessage(messageId, user.sub, user);
  }

  /**
   * Mark chat as read
   */
  @Post(':chatId/read')
  async markAsRead(
    @Param('chatId') chatId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.markAsRead(chatId, user.sub, user);
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
  ): Promise<unknown> {
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
    return this.chatService.getGroupChat(groupId, user.sub, user.role, user);
  }

  /**
   * Get students list for admin chat (Admin only)
   */
  @Get('admin/students')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAdminStudents(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    const branchCenterId = user.role === UserRole.MANAGER ? getManagerCenterIdOrThrow(user) : undefined;
    return this.chatService.getAdminStudents(user.sub, search, branchCenterId);
  }

  /**
   * Get teachers list for admin chat (Admin only)
   */
  @Get('admin/teachers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAdminTeachers(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    const branchCenterId = user.role === UserRole.MANAGER ? getManagerCenterIdOrThrow(user) : undefined;
    return this.chatService.getAdminTeachers(user.sub, search, branchCenterId);
  }

  /**
   * Get groups list for admin chat (Admin only)
   */
  @Get('admin/groups')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAdminGroups(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    const branchCenterId = user.role === UserRole.MANAGER ? getManagerCenterIdOrThrow(user) : undefined;
    return this.chatService.getAdminGroups(user.sub, search, branchCenterId);
  }

  /**
   * Get all registered users for admin (e.g. add-member picker). Admin only.
   */
  @Get('admin/users')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAdminAllUsers(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    const branchCenterId = user.role === UserRole.MANAGER ? getManagerCenterIdOrThrow(user) : undefined;
    return this.chatService.getAdminAllUsers(user.sub, search, branchCenterId);
  }

  /**
   * Get all student voice recordings for admin (grouped/filtered on UI).
   * Optional query: groupIds (repeat or array), studentIds (repeat or array),
   * legacy groupId, studentUserId, search.
   */
  @Get('admin/student-recordings')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAdminStudentRecordings(
    @CurrentUser() user: JwtPayload,
    @Query('groupId') groupId?: string,
    @Query('studentUserId') studentUserId?: string,
    @Query('groupIds') groupIds?: string | string[],
    @Query('studentIds') studentIds?: string | string[],
    @Query('search') search?: string,
  ) {
    const normalizedGroupIds = Array.isArray(groupIds)
      ? groupIds
      : groupIds
        ? [groupIds]
        : undefined;
    const normalizedStudentIds = Array.isArray(studentIds)
      ? studentIds
      : studentIds
        ? [studentIds]
        : undefined;

    const branchCenterId = user.role === UserRole.MANAGER ? getManagerCenterIdOrThrow(user) : undefined;
    return this.chatService.getAdminStudentRecordings(
      user.sub,
      {
        groupId,
        studentUserId,
        groupIds: normalizedGroupIds,
        studentIds: normalizedStudentIds,
        search,
      },
      branchCenterId,
    );
  }

  /**
   * Get student voice recordings visible to the current teacher.
   * Optional query: groupId, studentUserId, search.
   */
  @Get('teacher/student-recordings')
  @Roles(UserRole.TEACHER)
  async getTeacherStudentRecordings(
    @CurrentUser() user: JwtPayload,
    @Query('groupId') groupId?: string,
    @Query('studentUserId') studentUserId?: string,
    @Query('search') search?: string,
  ) {
    return this.chatService.getTeacherStudentRecordings(user.sub, {
      groupId,
      studentUserId,
      search,
    });
  }

  /**
   * Add a member to a group chat. Admin only.
   */
  @Post('group/:groupId/members')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addGroupChatMember(
    @Param('groupId') groupId: string,
    @Body() dto: AddGroupMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.addGroupChatMember(groupId, dto.userId, user);
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
  ): Promise<unknown> {
    return this.chatService.getTeacherStudents(user.sub, search);
  }

  /**
   * Get admin user info for Teacher Chat (Teacher only)
   */
  @Get('teacher/admin')
  @Roles(UserRole.TEACHER)
  async getAdminForTeacher(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.chatService.getAdminForTeacher(user.sub);
  }

  /**
   * Get admin user info for Student Chat (Student only)
   */
  @Get('student/admin')
  @Roles(UserRole.STUDENT)
  async getAdminForStudent(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.chatService.getAdminForStudent(user.sub);
  }

  /**
   * Get student's voice messages sent to teacher (for Recordings section). Student only.
   * Optional query: year, month, day (UTC) to filter by createdAt.
   */
  @Get('student/voice-to-teacher-recordings')
  @Roles(UserRole.STUDENT)
  async getStudentVoiceToTeacherRecordings(
    @CurrentUser() user: JwtPayload,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('day') day?: string,
  ) {
    const filters = {
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      day: day ? parseInt(day, 10) : undefined,
    };
    return this.chatService.getStudentVoiceToTeacherRecordings(user.sub, filters);
  }
}


