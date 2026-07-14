import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { AuthenticatedSocket } from './chat-gateway-auth.util';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly jwtService;
    private readonly configService;
    server: Server;
    private readonly logger;
    private onlineUsers;
    private userSockets;
    constructor(chatService: ChatService, jwtService: JwtService, configService: ConfigService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleSendMessage(client: AuthenticatedSocket, data: {
        chatId: string;
        content: string;
        type?: string;
        metadata?: Record<string, unknown>;
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        duration?: number;
    }): Promise<{
        success: boolean;
        error: string;
        message?: undefined;
    } | {
        success: boolean;
        message: import("./message.types").SendMessageResponse;
        error?: undefined;
    }>;
    private requireSocketUser;
    private emitToUser;
    private fanOutNewMessageToParticipants;
    broadcastNewMessage(chatId: string, message: unknown): void;
    handleEditMessage(client: AuthenticatedSocket, data: {
        messageId: string;
        content: string;
    }): Promise<unknown>;
    handleDeleteMessage(client: AuthenticatedSocket, data: {
        messageId: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    handleTypingStart(client: AuthenticatedSocket, data: {
        chatId: string;
    }): void;
    handleTypingStop(client: AuthenticatedSocket, data: {
        chatId: string;
    }): void;
    handleMarkAsRead(client: AuthenticatedSocket, data: {
        chatId: string;
    }): Promise<{
        success: boolean;
        readAt: string;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        readAt?: undefined;
    }>;
    handleJoinChat(client: AuthenticatedSocket, data: {
        chatId: string;
    }): Promise<{
        success: boolean;
        onlineUsers: string[];
        presence: {
            userId: string;
            isOnline: boolean;
            lastSeenAt: string | null;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        onlineUsers?: undefined;
        presence?: undefined;
    }>;
    handleSendVocabulary(client: AuthenticatedSocket, data: {
        chatId: string;
        words: string[];
    }): Promise<unknown>;
}
