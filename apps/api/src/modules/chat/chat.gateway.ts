import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { JwtPayload } from '../../common/types/auth.types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

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

  // Track online users per chat
  private onlineUsers: Map<string, Set<string>> = new Map();
  // Track user's socket connections
  private userSockets: Map<string, string[]> = new Map();

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
      // console.log('[ChatGateway] Incoming token:', token.slice(0, 30));

      // Verify token explicitly with the same secret used in HTTP auth
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      client.user = payload;

      // Track socket
      const existingSockets = this.userSockets.get(payload.sub) || [];
      this.userSockets.set(payload.sub, [...existingSockets, client.id]);

      console.log(`[ChatGateway] User ${payload.email} connected`);

      // Get user's chats and join rooms
      const chats = await this.chatService.getUserChats(payload.sub);
      chats.forEach((chat) => {
        void client.join(`chat:${chat.id}`);
        
        // Track online status
        if (!this.onlineUsers.has(chat.id)) {
          this.onlineUsers.set(chat.id, new Set());
        }
        this.onlineUsers.get(chat.id)?.add(payload.sub);

        // Notify others in chat
        client.to(`chat:${chat.id}`).emit('user:online', {
          chatId: chat.id,
          userId: payload.sub,
        });
      });

      // Send online users to connected client
      client.emit('connection:success', {
        userId: payload.sub,
        chats: chats.map((chat) => ({
          id: chat.id,
          onlineUsers: Array.from(this.onlineUsers.get(chat.id) || []),
        })),
      });
    } catch (error) {
      console.error('[ChatGateway] Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.user) return;

    const userId = client.user.sub;
    
    // Remove socket from tracking
    const sockets = this.userSockets.get(userId) || [];
    const remainingSockets = sockets.filter((id) => id !== client.id);
    
    if (remainingSockets.length === 0) {
      this.userSockets.delete(userId);

      // User is completely offline - notify all chats
      this.onlineUsers.forEach((users, chatId) => {
        if (users.has(userId)) {
          users.delete(userId);
          this.server.to(`chat:${chatId}`).emit('user:offline', {
            chatId,
            userId,
          });
        }
      });
    } else {
      this.userSockets.set(userId, remainingSockets);
    }

    console.log(`[ChatGateway] User ${client.user.email} disconnected`);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; content: string; type?: string; metadata?: Record<string, unknown> },
  ) {
    try {
      // CRITICAL: Validate client.user is set and has required fields
      if (!client.user || !client.user.sub) {
        console.error('[ChatGateway] handleSendMessage: client.user is missing or invalid', {
          hasUser: !!client.user,
          userId: client.user?.sub,
        });
        return { success: false, error: 'Authentication required' };
      }

      // CRITICAL: Log sender identity for debugging (dev only)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[ChatGateway] handleSendMessage: Sending message', {
          senderId: client.user.sub,
          senderRole: client.user.role,
          senderEmail: client.user.email,
          chatId: data.chatId,
        });
      }

      const message = await this.chatService.sendMessage(
        {
          chatId: data.chatId,
          content: data.content,
          type: data.type as never,
          metadata: data.metadata,
        },
        client.user.sub,
        client.user.role,
      );

      // Broadcast to all participants in the chat
      this.server.to(`chat:${data.chatId}`).emit('message:new', message);

      return { success: true, message };
    } catch (error) {
      console.error('[ChatGateway] Send message error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    try {
      const message = await this.chatService.editMessage(
        data.messageId,
        { content: data.content },
        client.user.sub,
      );

      // Broadcast to all participants
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
      // Get message first to get chatId before deletion
      const message = await this.chatService.getMessage(data.messageId);
      
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      const chatId = message.chatId;
      const messageId = message.id;

      // Delete the message (hard delete)
      await this.chatService.deleteMessage(
        data.messageId,
        client.user.sub,
      );

      // Broadcast to all participants
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
    client.to(`chat:${data.chatId}`).emit('typing:start', {
      chatId: data.chatId,
      userId: client.user.sub,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    client.to(`chat:${data.chatId}`).emit('typing:stop', {
      chatId: data.chatId,
      userId: client.user.sub,
    });
  }

  @SubscribeMessage('chat:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.chatId, client.user.sub);
      
      // Notify other participants that this user has read messages
      client.to(`chat:${data.chatId}`).emit('chat:read', {
        chatId: data.chatId,
        userId: client.user.sub,
        readAt: new Date(),
      });

      return { success: true };
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
      // Verify user is participant
      await this.chatService.getChatById(data.chatId, client.user.sub, client.user.role);
      
      void client.join(`chat:${data.chatId}`);
      
      if (!this.onlineUsers.has(data.chatId)) {
        this.onlineUsers.set(data.chatId, new Set());
      }
      this.onlineUsers.get(data.chatId)?.add(client.user.sub);

      client.to(`chat:${data.chatId}`).emit('user:online', {
        chatId: data.chatId,
        userId: client.user.sub,
      });

      return { 
        success: true, 
        onlineUsers: Array.from(this.onlineUsers.get(data.chatId) || []),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('vocabulary:send')
  async handleSendVocabulary(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; words: string[] },
  ) {
    try {
      // CRITICAL: Validate client.user is set and has required fields
      if (!client.user || !client.user.sub) {
        console.error('[ChatGateway] handleSendVocabulary: client.user is missing or invalid', {
          hasUser: !!client.user,
          userId: client.user?.sub,
        });
        return { success: false, error: 'Authentication required' };
      }

      const message = await this.chatService.sendVocabularyMessage(
        data.chatId,
        client.user.sub,
        data.words,
      );

      this.server.to(`chat:${data.chatId}`).emit('message:new', message);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}


