export type AbsenceType = 'JUSTIFIED' | 'UNJUSTIFIED';

export interface AttendanceRecord {
  id: string;
  lessonId: string;
  studentId: string;
  isPresent: boolean;
  absenceType?: AbsenceType | null;
  note?: string;
  markedAt?: string;
  student: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  };
}

export interface StudentWithAttendance {
  student: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      status?: string;
    };
  };
  attendance: AttendanceRecord | null;
}

export interface LessonAttendance {
  lesson: {
    id: string;
    scheduledAt: string;
    topic?: string;
    status: string;
  };
  studentsWithAttendance: StudentWithAttendance[];
  summary: {
    total: number;
    present: number;
    absent: number;
    notMarked: number;
  };
}

export interface StudentAttendanceHistory {
  attendances: {
    id: string;
    isPresent: boolean;
    absenceType?: AbsenceType | null;
    note?: string;
    lesson: {
      id: string;
      scheduledAt: string;
      topic?: string;
      group: {
        id: string;
        name: string;
      };
    };
  }[];
  statistics: {
    total: number;
    present: number;
    absent: number;
    absentJustified: number;
    absentUnjustified: number;
    attendanceRate: number;
  };
}

export interface MarkAttendanceDto {
  lessonId: string;
  studentId: string;
  isPresent: boolean;
  absenceType?: AbsenceType;
  note?: string;
}

export interface BulkAttendanceDto {
  lessonId: string;
  attendances: {
    studentId: string;
    isPresent: boolean;
    absenceType?: AbsenceType;
    note?: string;
  }[];
}

export interface AtRiskStudent {
  student: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    parentPhone?: string;
    parentEmail?: string;
  };
  group?: {
    id: string;
    name: string;
  };
  unjustifiedAbsences: number;
  threshold: number;
}

export interface GroupAttendanceReport {
  groupId: string;
  dateRange: {
    from: string;
    to: string;
  };
  lessonsCount: number;
  studentsReport: {
    student: {
      id: string;
      name: string;
    };
    attendances: {
      lessonId: string;
      date: string;
      isPresent: boolean | null;
      absenceType: AbsenceType | null;
    }[];
    statistics: {
      totalLessons: number;
      present: number;
      absentJustified: number;
      absentUnjustified: number;
      attendanceRate: number;
    };
  }[];
}
