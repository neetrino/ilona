import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../common/types/auth.types';
export interface AuthenticatedSocket extends Socket {
    user: JwtPayload;
}
export declare function resolveSocketUser(client: AuthenticatedSocket, jwtService: JwtService, configService: ConfigService): JwtPayload;
