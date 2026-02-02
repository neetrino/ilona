import { UserRole, UserStatus } from '@prisma/client';

/**
 * JWT Payload structure used in authentication
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * User without sensitive data
 */
export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Login response
 */
export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}


