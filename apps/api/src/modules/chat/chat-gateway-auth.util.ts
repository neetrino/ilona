import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../common/types/auth.types';

export interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

/**
 * Re-verify JWT from the live handshake on every mutative socket event.
 * Prevents stale client.user after token/account switches without a full reconnect.
 */
export function resolveSocketUser(
  client: AuthenticatedSocket,
  jwtService: JwtService,
  configService: ConfigService,
): JwtPayload {
  const token =
    (client.handshake.auth?.token as string | undefined) ||
    (client.handshake.query.token as string | undefined) ||
    client.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Authentication required');
  }

  const payload = jwtService.verify<JwtPayload>(token, {
    secret: configService.get<string>('jwt.secret'),
  });

  if (!payload?.sub) {
    throw new Error('Authentication required');
  }

  if (payload.typ === 'refresh') {
    throw new Error('Invalid token type');
  }

  client.user = payload;
  return payload;
}
