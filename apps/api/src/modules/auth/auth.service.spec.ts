import { UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: {
    findByEmail: Mock;
    findById: Mock;
    updateLastLogin: Mock;
  };
  let mockJwtService: {
    signAsync: Mock;
    verifyAsync: Mock;
  };
  let mockConfigService: {
    get: Mock;
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatarUrl: null,
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUsersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      updateLastLogin: vi.fn(),
    };

    mockJwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string) => {
        const config: Record<string, string> = {
          'jwt.secret': 'test-secret',
          'jwt.accessExpiration': '15m',
          'jwt.refreshExpiration': '7d',
        };
        return config[key];
      }),
    };

    // Create service instance manually
    authService = new AuthService(
      mockUsersService as never,
      mockJwtService as never,
      mockConfigService as never,
    );
  });

  describe('login', () => {
    it('should successfully login a user with valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as Mock).mockResolvedValue(true);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await authService.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('test@test.com');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith('user-1');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });
      (bcrypt.compare as Mock).mockResolvedValue(true);

      await expect(
        authService.login({
          email: 'test@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const mockPayload = { sub: 'user-1', email: 'test@test.com', role: 'ADMIN', typ: 'refresh' as const };
      
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        authService.refreshTokens('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is an access token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'test@test.com',
        role: 'ADMIN',
        typ: 'access',
      });

      await expect(
        authService.refreshTokens('access-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject legacy short-lived tokens without typ', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'test@test.com',
        role: 'ADMIN',
        iat: now,
        exp: now + 15 * 60,
      });

      await expect(
        authService.refreshTokens('legacy-access-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const mockPayload = { sub: 'user-1', email: 'test@test.com', role: 'ADMIN', typ: 'refresh' as const };
      
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockUsersService.findById.mockResolvedValue({
        ...mockUser,
        status: 'INACTIVE',
      });

      await expect(
        authService.refreshTokens('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
