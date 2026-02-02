// ============================================
// Attendance Types
// ============================================

export enum AbsenceType {
  JUSTIFIED = 'JUSTIFIED',
  UNJUSTIFIED = 'UNJUSTIFIED',
}

export interface Attendance {
  id: string;
  lessonId: string;
  studentId: string;
  isPresent: boolean;
  absenceType?: AbsenceType | null;
  note?: string | null;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceWithStudent extends Attendance {
  student?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface AttendanceWithLesson extends Attendance {
  lesson?: {
    id: string;
    scheduledAt: Date;
    topic?: string | null;
    group?: {
      id: string;
      name: string;
    };
  };
}

// ============================================
// Statistics
// ============================================

export interface StudentAttendanceStats {
  studentId: string;
  totalLessons: number;
  presentCount: number;
  absentCount: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  attendanceRate: number; // percentage
  riskLevel: 'low' | 'medium' | 'high'; // 🟢 🟡 🔴
}

export interface GroupAttendanceStats {
  groupId: string;
  totalStudents: number;
  averageAttendanceRate: number;
  studentsAtRisk: number;
}

// ============================================
// DTOs
// ============================================

export interface MarkAttendanceDto {
  lessonId: string;
  studentId: string;
  isPresent: boolean;
  absenceType?: AbsenceType;
  note?: string;
}

export interface BulkMarkAttendanceDto {
  lessonId: string;
  attendances: Array<{
    studentId: string;
    isPresent: boolean;
    absenceType?: AbsenceType;
    note?: string;
  }>;
}

export interface UpdateAttendanceDto {
  isPresent?: boolean;
  absenceType?: AbsenceType;
  note?: string;
}


