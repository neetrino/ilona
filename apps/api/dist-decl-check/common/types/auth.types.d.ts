import { UserRole, UserStatus } from '@ilona/database';
export type JwtTokenType = 'access' | 'refresh';
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    managerCenterId?: string | null;
    typ?: JwtTokenType;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface SafeUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    role: UserRole;
    managerCenterId?: string | null;
    status: UserStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthResponse {
    user: SafeUser;
    tokens: AuthTokens;
}
