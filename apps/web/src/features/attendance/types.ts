export type AbsenceType = 'JUSTIFIED' | 'UNJUSTIFIED';

export interface AttendanceRecord {
  id: string;
  lessonId: string;
  studentId: string;
  markedById?: string | null;
  isPresent: boolean;
  absenceType?: AbsenceType | null;
  note?: string;
  markedAt?: string;
  markedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';
  } | null;
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

export interface CalendarLesson {
  id: string;
  scheduledAt: string;
  topic?: string | null;
  group: {
    id: string;
    name: string;
  };
}

export interface PlannedAbsenceRecord {
  id: string;
  date: string;
  status: string;
  comment: string;
}

export interface StaffPlannedAbsenceItem {
  id: string;
  date: string;
  status: string;
  comment: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    group?: { id: string; name: string } | null;
  };
}

export interface StudentAttendanceHistory {
  attendances: {
    id: string;
    isPresent: boolean;
    absenceType?: AbsenceType | null;
    note?: string;
    markedById?: string | null;
    markedBy?: {
      id: string;
      firstName: string;
      lastName: string;
      role: 'ADMIN' | 'MANAGER' | 'TEACHER' | 'STUDENT';
    } | null;
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

/** Month view: group schedule + attendance rows + planned absences */
export interface StudentCalendarMonth {
  lessons: CalendarLesson[];
  attendances: StudentAttendanceHistory['attendances'];
  plannedAbsences: PlannedAbsenceRecord[];
  statistics: StudentAttendanceHistory['statistics'];
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
