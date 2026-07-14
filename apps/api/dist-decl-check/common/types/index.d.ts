import { UserRole } from '@ilona/types';
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface PaginationParams {
    skip?: number;
    take?: number;
}
export interface SuccessResponse {
    success: boolean;
    message?: string;
}
