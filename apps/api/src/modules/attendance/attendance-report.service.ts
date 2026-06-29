import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { AttendanceScopeService } from './attendance-scope.service';

@Injectable()
export class AttendanceReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: AttendanceScopeService,
  ) {}
  async getGroupAttendanceReport(groupId: string, dateFrom: Date, dateTo: Date, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.scope.getManagerCenterId(userId, userRole);
    // Verify group exists and check authorization
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        teacherId: true,
        centerId: true,
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    // Authorization: Teachers can only access reports for their assigned groups
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || group.teacherId !== teacher.id) {
        throw new ForbiddenException('You do not have access to this group');
      }
    }

    if (managerCenterId && group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this group');
    }

    // Get all students in group
    const students = await this.prisma.student.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Get all lessons in date range
    const lessons = await this.prisma.lesson.findMany({
      where: {
        groupId,
        scheduledAt: { gte: dateFrom, lte: dateTo },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      include: {
        attendances: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Build report
    const report = students.map((student) => {
      const studentAttendances = lessons.map((lesson) => {
        const attendance = lesson.attendances.find((a) => a.studentId === student.id);
        return {
          lessonId: lesson.id,
          date: lesson.scheduledAt,
          isPresent: attendance?.isPresent ?? null,
          absenceType: attendance?.absenceType ?? null,
        };
      });

      const totalLessons = lessons.length;
      const present = studentAttendances.filter((a) => a.isPresent === true).length;
      const absentJustified = studentAttendances.filter(
        (a) => a.isPresent === false && a.absenceType === 'JUSTIFIED',
      ).length;
      const absentUnjustified = studentAttendances.filter(
        (a) => a.isPresent === false && a.absenceType === 'UNJUSTIFIED',
      ).length;

      return {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
        },
        attendances: studentAttendances,
        statistics: {
          totalLessons,
          present,
          absentJustified,
          absentUnjustified,
          attendanceRate: totalLessons > 0 ? Math.round((present / totalLessons) * 100) : 0,
        },
      };
    });

    return {
      groupId,
      dateRange: { from: dateFrom, to: dateTo },
      lessonsCount: lessons.length,
      studentsReport: report,
    };
  }

  async getAtRiskStudents(maxUnjustifiedAbsences = 3, currentUser?: { sub: string; role: UserRole }) {
    // Get system settings for threshold
    const settings = await this.prisma.systemSettings.findFirst();
    const threshold = settings?.maxUnjustifiedAbsences ?? maxUnjustifiedAbsences;

    // Find students with too many unjustified absences in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const managerCenterId = await this.scope.getManagerCenterId(currentUser?.sub, currentUser?.role);

    const atRiskStudents = await this.prisma.student.findMany({
      where: {
        ...(managerCenterId ? { group: { centerId: managerCenterId } } : {}),
        attendances: {
          some: {
            isPresent: false,
            absenceType: 'UNJUSTIFIED',
            lesson: {
              scheduledAt: { gte: oneMonthAgo },
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: { id: true, name: true },
        },
        attendances: {
          where: {
            isPresent: false,
            absenceType: 'UNJUSTIFIED',
            lesson: {
              scheduledAt: { gte: oneMonthAgo },
            },
          },
        },
      },
    });

    return atRiskStudents
      .filter((student) => student.attendances.length >= threshold)
      .map((student) => ({
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
          phone: student.user.phone,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
        },
        group: student.group,
        unjustifiedAbsences: student.attendances.length,
        threshold,
      }));
  }
}
