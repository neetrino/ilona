import { UserRole } from '@prisma/client';

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Base query params for pagination
 */
export interface PaginationParams {
  skip?: number;
  take?: number;
}

/**
 * API Success response
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
}


