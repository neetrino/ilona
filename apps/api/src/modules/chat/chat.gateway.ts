import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { JwtPayload } from '../../common/types/auth.types';
import {
  AuthenticatedSocket,
  resolveSocketUser,
} from './chat-gateway-auth.util';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    // In development, allow all origins for network access
    // In production, use specific origin from environment
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL || 'http://localhost:3000')
      : true, // Allow all origins in development
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Track online users per chat
  private onlineUsers: Map<string, Set<string>> = new Map();
  // Track user's socket connections
  private userSockets: Map<string, string[]> = new Map();
  // Track connected user roles (for class-group unread fan-out to admins)
  private userRoles: Map<string, string> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from query or auth header
      const token =
        (client.handshake.query.token as string | undefined) ||
        (client.handshake.auth.token as string | undefined) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      // Optional debug logging (safe: only prefix)
      // this.logger.debug('Incoming token: ' + token.slice(0, 30));

      // Verify token explicitly with the same secret used in HTTP auth
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      client.user = payload;

      // Track socket
      const existingSockets = this.userSockets.get(payload.sub) || [];
      const isFirstSocket = existingSockets.length === 0;
      this.userSockets.set(payload.sub, [...existingSockets, client.id]);
      this.userRoles.set(payload.sub, payload.role);

      this.logger.log(`User ${payload.email} connected`);

      await this.chatService.touchUserLastSeen(payload.sub);

      // Get user's chats and join rooms
      const chats = (await this.chatService.getUserChats(payload.sub, payload)) as Array<{
        id: string;
        participants?: Array<{ userId: string; user?: { lastSeenAt?: Date | string | null } }>;
      }>;

      const partnerIds = new Set<string>();
      chats.forEach((chat) => {
        void client.join(`chat:${chat.id}`);

        if (!this.onlineUsers.has(chat.id)) {
          this.onlineUsers.set(chat.id, new Set());
        }
        this.onlineUsers.get(chat.id)?.add(payload.sub);

        chat.participants?.forEach((participant) => {
          if (participant.userId !== payload.sub) {
            partnerIds.add(participant.userId);
          }
        });

        if (isFirstSocket) {
          client.to(`chat:${chat.id}`).emit('user:online', {
            chatId: chat.id,
            userId: payload.sub,
          });
        }
      });

      const partnersLastSeen = await this.chatService.getUsersLastSeen(Array.from(partnerIds));
      const presence = partnersLastSeen.map((partner) => ({
        userId: partner.id,
        isOnline: this.userSockets.has(partner.id),
        lastSeenAt: partner.lastSeenAt ? partner.lastSeenAt.toISOString() : null,
      }));

      client.emit('connection:success', {
        userId: payload.sub,
        chats: chats.map((chat) => ({
          id: chat.id,
          onlineUsers: Array.from(this.onlineUsers.get(chat.id) || []),
        })),
        presence,
      });
    } catch (error) {
      const isTokenExpired = error && typeof error === 'object' && 'name' in error && (error as Error).name === 'TokenExpiredError';
      if (isTokenExpired) {
        this.logger.warn('Connection rejected: token expired');
        client.emit('connection:error', { code: 'TOKEN_EXPIRED', message: 'Token expired' });
      } else {
        this.logger.error('Connection error', (error as Error)?.stack ?? (error as Error)?.message);
      }
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.user) return;

    const userId = client.user.sub;
    const email = client.user.email;

    // Remove socket from tracking
    const sockets = this.userSockets.get(userId) || [];
    const remainingSockets = sockets.filter((id) => id !== client.id);

    if (remainingSockets.length === 0) {
      this.userSockets.delete(userId);
      this.userRoles.delete(userId);

      void this.chatService
        .touchUserLastSeen(userId)
        .then((lastSeenAt) => {
          // User may have reconnected before this async callback ran.
          if (this.userSockets.has(userId)) return;

          const lastSeenIso = lastSeenAt.toISOString();
          this.onlineUsers.forEach((users, chatId) => {
            if (users.has(userId)) {
              users.delete(userId);
              this.server.to(`chat:${chatId}`).emit('user:offline', {
                chatId,
                userId,
                lastSeenAt: lastSeenIso,
              });
            }
          });
        })
        .catch((error: unknown) => {
          this.logger.warn(
            `Failed to persist lastSeenAt for ${userId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          if (this.userSockets.has(userId)) return;

          this.onlineUsers.forEach((users, chatId) => {
            if (users.has(userId)) {
              users.delete(userId);
              this.server.to(`chat:${chatId}`).emit('user:offline', {
                chatId,
                userId,
                lastSeenAt: new Date().toISOString(),
              });
            }
          });
        });
    } else {
      this.userSockets.set(userId, remainingSockets);
    }

    this.logger.log(`User ${email} disconnected`);
  }

  /**
   * Handle send message. SECURITY: Sender identity is taken ONLY from a freshly
   * verified JWT on the handshake (never from the message payload, never from a
   * stale client.user cached at first connect).
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; content: string; type?: string; metadata?: Record<string, unknown>; fileUrl?: string; fileName?: string; fileSize?: number; duration?: number },
  ) {
    try {
      const authUser = this.requireSocketUser(client);

      // Voice messages must be sent via HTTP (upload file first, then send with fileUrl)
      if (data.type === 'VOICE') {
        return { success: false, error: 'Voice messages must be sent via the REST API after uploading the file' };
      }

      const senderIdFromAuth = authUser.sub;
      const senderRoleFromAuth = authUser.role;

      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(
          JSON.stringify({ message: 'handleSendMessage', senderId: senderIdFromAuth, senderRole: senderRoleFromAuth, chatId: data.chatId }),
        );
      }

      const message = await this.chatService.sendMessage(
        {
          chatId: data.chatId,
          content: data.content,
          type: data.type as never,
          metadata: data.metadata,
        },
        senderIdFromAuth,
        senderRoleFromAuth,
        authUser,
      );

      // Brand-new DMs are not in the room until chat:join — join sender, then
      // broadcast to the room and fan-out only to peers not yet in the room.
      void client.join(`chat:${data.chatId}`);
      if (!this.onlineUsers.has(data.chatId)) {
        this.onlineUsers.set(data.chatId, new Set());
      }
      this.onlineUsers.get(data.chatId)?.add(senderIdFromAuth);

      this.broadcastNewMessage(data.chatId, message);
      await this.fanOutNewMessageToParticipants(data.chatId, senderIdFromAuth, authUser, message);

      return { success: true, message };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Send message error', error.stack ?? error.message);
      return { success: false, error: error.message };
    }
  }

  private requireSocketUser(client: AuthenticatedSocket): JwtPayload {
    try {
      return resolveSocketUser(client, this.jwtService, this.configService);
    } catch (error) {
      this.logger.error('Socket auth failed', {
        hasUser: !!client.user,
        userId: client.user?.sub,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Authentication required');
    }
  }

  private emitToUser(userId: string, event: string, payload: unknown): void {
    const socketIds = this.userSockets.get(userId) || [];
    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  /** Users who already receive room broadcasts — must not also get a direct fan-out. */
  private async getUserIdsInChatRoom(chatId: string): Promise<Set<string>> {
    try {
      const sockets = await this.server.in(`chat:${chatId}`).fetchSockets();
      const socketIdsInRoom = new Set(sockets.map((entry) => entry.id));
      const userIds = new Set<string>();
      for (const [userId, socketIds] of this.userSockets) {
        if (socketIds.some((socketId) => socketIdsInRoom.has(socketId))) {
          userIds.add(userId);
        }
      }
      return userIds;
    } catch {
      return new Set();
    }
  }

  private async fanOutNewMessageToParticipants(
    chatId: string,
    senderId: string,
    authUser: JwtPayload,
    message: unknown,
  ): Promise<void> {
    try {
      const chat = (await this.chatService.getChatById(
        chatId,
        senderId,
        authUser.role,
        authUser,
      )) as {
        type?: string;
        groupId?: string | null;
        participants: Array<{ userId: string }>;
      };
      // Prefer live socket.io room membership over onlineUsers map (can drift on reconnect).
      const usersInRoom = await this.getUserIdsInChatRoom(chatId);
      const roomMembers = this.onlineUsers.get(chatId);
      const notified = new Set<string>();

      for (const participant of chat.participants) {
        // Room broadcast already reaches anyone currently in the chat room.
        // Only direct-emit to connected users who have not joined this room yet
        // (e.g. brand-new DM before chat:join) — avoids duplicate message:new.
        if (usersInRoom.has(participant.userId) || roomMembers?.has(participant.userId)) {
          continue;
        }
        this.emitToUser(participant.userId, 'message:new', message);
        notified.add(participant.userId);
      }

      // Class group chats: notify online admins/managers even before they open the chat
      // (they may not be ChatParticipants until the admin groups list is loaded).
      if (chat.type === 'GROUP' && chat.groupId) {
        for (const [userId, role] of this.userRoles) {
          if (role !== 'ADMIN' && role !== 'MANAGER') continue;
          if (userId === senderId) continue;
          if (
            notified.has(userId) ||
            usersInRoom.has(userId) ||
            roomMembers?.has(userId)
          ) {
            continue;
          }
          this.emitToUser(userId, 'message:new', message);
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fan-out message to participants for chat ${chatId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Broadcast a new message to all participants in a chat.
   * Used when message is created via HTTP (e.g. voice message after file upload).
   */
  broadcastNewMessage(chatId: string, message: unknown): void {
    this.server?.to(`chat:${chatId}`).emit('message:new', message);
  }

  /** HTTP send path: room broadcast + direct emit to offline-room participants / admins. */
  async notifyNewMessage(
    chatId: string,
    message: unknown,
    senderId: string,
    authUser: JwtPayload,
  ): Promise<void> {
    this.broadcastNewMessage(chatId, message);
    await this.fanOutNewMessageToParticipants(chatId, senderId, authUser, message);
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; content: string },
  ): Promise<unknown> {
    try {
      const authUser = this.requireSocketUser(client);
      const message = (await this.chatService.editMessage(
        data.messageId,
        { content: data.content },
        authUser.sub,
        authUser,
      )) as { chatId: string };

      this.server.to(`chat:${message.chatId}`).emit('message:edited', message);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const authUser = this.requireSocketUser(client);
      const message = (await this.chatService.getMessage(data.messageId)) as {
        chatId: string;
        id: string;
      } | null;

      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      const chatId = message.chatId;
      const messageId = message.id;

      await this.chatService.deleteMessage(data.messageId, authUser.sub, authUser);

      this.server.to(`chat:${chatId}`).emit('message:deleted', {
        messageId,
        chatId,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const authUser = this.requireSocketUser(client);
      client.to(`chat:${data.chatId}`).emit('typing:start', {
        chatId: data.chatId,
        userId: authUser.sub,
      });
    } catch {
      // ignore unauthenticated typing events
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const authUser = this.requireSocketUser(client);
      client.to(`chat:${data.chatId}`).emit('typing:stop', {
        chatId: data.chatId,
        userId: authUser.sub,
      });
    } catch {
      // ignore unauthenticated typing events
    }
  }

  @SubscribeMessage('chat:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const authUser = this.requireSocketUser(client);
      await this.chatService.markAsRead(data.chatId, authUser.sub, authUser);

      const readAt = new Date().toISOString();
      client.to(`chat:${data.chatId}`).emit('chat:read', {
        chatId: data.chatId,
        userId: authUser.sub,
        readAt,
      });

      return { success: true, readAt };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const authUser = this.requireSocketUser(client);
      const chat = await this.chatService.getChatById(
        data.chatId,
        authUser.sub,
        authUser.role,
        authUser,
      );

      void client.join(`chat:${data.chatId}`);

      if (!this.onlineUsers.has(data.chatId)) {
        this.onlineUsers.set(data.chatId, new Set());
      }
      this.onlineUsers.get(data.chatId)?.add(authUser.sub);

      // Prefer global socket map so online status is correct even if peer
      // has not joined this room yet (e.g. newly created DM).
      const roomOnline = this.onlineUsers.get(data.chatId) ?? new Set<string>();
      for (const participant of chat.participants) {
        if (this.userSockets.has(participant.userId)) {
          roomOnline.add(participant.userId);
        }
      }
      this.onlineUsers.set(data.chatId, roomOnline);

      client.to(`chat:${data.chatId}`).emit('user:online', {
        chatId: data.chatId,
        userId: authUser.sub,
      });

      const presence = chat.participants.map((participant) => ({
        userId: participant.userId,
        isOnline: this.userSockets.has(participant.userId),
        lastSeenAt: participant.user.lastSeenAt
          ? new Date(participant.user.lastSeenAt).toISOString()
          : null,
      }));

      return {
        success: true,
        onlineUsers: Array.from(this.onlineUsers.get(data.chatId) || []),
        presence,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('vocabulary:send')
  async handleSendVocabulary(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; words: string[] },
  ): Promise<unknown> {
    try {
      const authUser = this.requireSocketUser(client);
      const message = await this.chatService.sendVocabularyMessage(
        data.chatId,
        authUser.sub,
        data.words,
      );

      this.server.to(`chat:${data.chatId}`).emit('message:new', message);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}


