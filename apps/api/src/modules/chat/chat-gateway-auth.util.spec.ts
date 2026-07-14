import { describe, it, expect, vi } from 'vitest';
import { resolveSocketUser, type AuthenticatedSocket } from './chat-gateway-auth.util';
import { UserRole } from '@ilona/database';

describe('resolveSocketUser', () => {
  const jwtService = {
    verify: vi.fn(),
  };
  const configService = {
    get: vi.fn().mockReturnValue('test-secret'),
  };

  const baseClient = {
    handshake: {
      auth: { token: 'access-token' },
      query: {},
      headers: {},
    },
    user: undefined as AuthenticatedSocket['user'] | undefined,
  };

  it('re-verifies handshake token and refreshes client.user', () => {
    const payload = {
      sub: 'student-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
      typ: 'access' as const,
    };
    jwtService.verify.mockReturnValue(payload);

    const client = { ...baseClient, handshake: { ...baseClient.handshake } } as AuthenticatedSocket;
    client.user = {
      sub: 'admin-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    const resolved = resolveSocketUser(
      client,
      jwtService as never,
      configService as never,
    );

    expect(resolved.sub).toBe('student-1');
    expect(client.user.sub).toBe('student-1');
    expect(jwtService.verify).toHaveBeenCalledWith('access-token', {
      secret: 'test-secret',
    });
  });

  it('rejects refresh tokens', () => {
    jwtService.verify.mockReturnValue({
      sub: 'student-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
      typ: 'refresh',
    });

    const client = { ...baseClient } as AuthenticatedSocket;

    expect(() =>
      resolveSocketUser(client, jwtService as never, configService as never),
    ).toThrow('Invalid token type');
  });
});
