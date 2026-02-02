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
import { ChatService } from './chat.service';
import { JwtPayload } from '../../common/types/auth.types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from query or auth header
      const token = 
        client.handshake.query.token as string ||
        client.handshake.auth.token as string ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify token
      const payload = this.jwtService.verify<JwtPayload>(token);
      client.user = payload;

      // Track socket
      const existingSockets = this.userSockets.get(payload.sub) || [];
      this.userSockets.set(payload.sub, [...existingSockets, client.id]);

      console.log(`[ChatGateway] User ${payload.email} connected`);

      // Get user's chats and join rooms
      const chats = await this.chatService.getUserChats(payload.sub);
      chats.forEach((chat) => {
        client.join(`chat:${chat.id}`);
        
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

  async handleDisconnect(client: AuthenticatedSocket) {
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
      const message = await this.chatService.sendMessage(
        {
          chatId: data.chatId,
          content: data.content,
          type: data.type as never,
          metadata: data.metadata,
        },
        client.user.sub,
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
      const message = await this.chatService.deleteMessage(
        data.messageId,
        client.user.sub,
      );

      // Broadcast to all participants
      this.server.to(`chat:${message.chatId}`).emit('message:deleted', {
        messageId: message.id,
        chatId: message.chatId,
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
      await this.chatService.getChatById(data.chatId, client.user.sub);
      
      client.join(`chat:${data.chatId}`);
      
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


