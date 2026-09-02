import { Injectable } from '@nestjs/common';
import { MarkAttendanceDto, BulkAttendanceDto } from './dto';
import { AbsenceType, UserRole } from '@ilona/database';
import { AttendanceLessonQueryService } from './attendance-lesson-query.service';
import { AttendanceStudentQueryService } from './attendance-student-query.service';
import { AttendanceReportService } from './attendance-report.service';
import { AttendanceWriteService } from './attendance-write.service';
import { AttendancePlannedAbsenceService } from './attendance-planned-absence.service';

/** Facade for attendance operations — delegates to domain-specific services. */
@Injectable()
export class AttendanceService {
  constructor(
    private readonly lessonQuery: AttendanceLessonQueryService,
    private readonly studentQuery: AttendanceStudentQueryService,
    private readonly reportService: AttendanceReportService,
    private readonly writeService: AttendanceWriteService,
    private readonly plannedAbsenceService: AttendancePlannedAbsenceService,
  ) {}

  getByLesson(lessonId: string, userId?: string, userRole?: UserRole) {
    return this.lessonQuery.getByLesson(lessonId, userId, userRole);
  }

  getByLessons(lessonIds: string[], userId?: string, userRole?: UserRole) {
    return this.lessonQuery.getByLessons(lessonIds, userId, userRole);
  }

  getByStudent(studentId: string, params?: { dateFrom?: Date; dateTo?: Date }) {
    return this.studentQuery.getByStudent(studentId, params);
  }

  getStudentCalendarMonth(studentId: string, params?: { dateFrom?: Date; dateTo?: Date }) {
    return this.studentQuery.getStudentCalendarMonth(studentId, params);
  }

  markAttendance(dto: MarkAttendanceDto, userId?: string, userRole?: UserRole) {
    return this.writeService.markAttendance(dto, userId, userRole);
  }

  markBulkAttendance(dto: BulkAttendanceDto, userId?: string, userRole?: UserRole) {
    return this.writeService.markBulkAttendance(dto, userId, userRole);
  }

  updateAbsenceType(
    attendanceId: string,
    absenceType: AbsenceType,
    note?: string,
    userId?: string,
    userRole?: UserRole,
  ) {
    return this.writeService.updateAbsenceType(attendanceId, absenceType, note, userId, userRole);
  }

  getGroupAttendanceReport(groupId: string, dateFrom: Date, dateTo: Date, userId?: string, userRole?: UserRole) {
    return this.reportService.getGroupAttendanceReport(groupId, dateFrom, dateTo, userId, userRole);
  }

  getAtRiskStudents(currentUser?: { sub: string; role: UserRole }) {
    return this.reportService.getAtRiskStudents(currentUser);
  }

  createPlannedAbsenceForStudentUser(userId: string, dateStr: string, rawComment: string) {
    return this.plannedAbsenceService.createPlannedAbsenceForStudentUser(userId, dateStr, rawComment);
  }

  deleteMyPlannedAbsence(userId: string, plannedAbsenceId: string) {
    return this.plannedAbsenceService.deleteMyPlannedAbsence(userId, plannedAbsenceId);
  }

  listPlannedAbsencesForStaff(dateFrom: Date, dateTo: Date, userId: string, userRole: UserRole) {
    return this.plannedAbsenceService.listPlannedAbsencesForStaff(dateFrom, dateTo, userId, userRole);
  }
}
