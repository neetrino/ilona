// ============================================
// User Types
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithProfile extends User {
  teacher?: TeacherProfile | null;
  student?: StudentProfile | null;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  bio?: string | null;
  specialization?: string | null;
  hourlyRate: number;
  workingDays: string[];
  workingHours?: {
    MON?: Array<{ start: string; end: string }>;
    TUE?: Array<{ start: string; end: string }>;
    WED?: Array<{ start: string; end: string }>;
    THU?: Array<{ start: string; end: string }>;
    FRI?: Array<{ start: string; end: string }>;
    SAT?: Array<{ start: string; end: string }>;
    SUN?: Array<{ start: string; end: string }>;
  } | null;
  hireDate: Date;
}

export interface StudentProfile {
  id: string;
  userId: string;
  groupId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  monthlyFee: number;
  enrolledAt: Date;
  notes?: string | null;
  receiveReports: boolean;
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ============================================
// DTOs
// ============================================

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CreateTeacherDto extends CreateUserDto {
  bio?: string;
  specialization?: string;
  hourlyRate: number;
  workingDays: string[];
}

export interface CreateStudentDto extends CreateUserDto {
  groupId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  monthlyFee: number;
}

