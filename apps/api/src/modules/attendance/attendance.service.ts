import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto, BulkAttendanceDto } from './dto';
import { Prisma, AbsenceType } from '@prisma/client';
import { SalariesService } from '../finance/salaries.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}

  async getByLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        attendances: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Combine students with their attendance records
    const studentsWithAttendance = lesson.group.students.map((student) => {
      const attendance = lesson.attendances.find((a) => a.studentId === student.id);
      return {
        student,
        attendance: attendance || null,
      };
    });

    return {
      lesson: {
        id: lesson.id,
        scheduledAt: lesson.scheduledAt,
        topic: lesson.topic,
        status: lesson.status,
      },
      studentsWithAttendance,
      summary: {
        total: studentsWithAttendance.length,
        present: lesson.attendances.filter((a) => a.isPresent).length,
        absent: lesson.attendances.filter((a) => !a.isPresent).length,
        notMarked: studentsWithAttendance.length - lesson.attendances.length,
      },
    };
  }

  async getByStudent(studentId: string, params?: { dateFrom?: Date; dateTo?: Date }) {
    const { dateFrom, dateTo } = params || {};

    const where: Prisma.AttendanceWhereInput = { studentId };

    if (dateFrom || dateTo) {
      where.lesson = {
        scheduledAt: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            scheduledAt: true,
            topic: true,
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { lesson: { scheduledAt: 'desc' } },
    });

    // Calculate statistics
    const total = attendances.length;
    const present = attendances.filter((a) => a.isPresent).length;
    const absentJustified = attendances.filter(
      (a) => !a.isPresent && a.absenceType === 'JUSTIFIED',
    ).length;
    const absentUnjustified = attendances.filter(
      (a) => !a.isPresent && a.absenceType === 'UNJUSTIFIED',
    ).length;

    return {
      attendances,
      statistics: {
        total,
        present,
        absent: total - present,
        absentJustified,
        absentUnjustified,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      },
    };
  }

  async markAttendance(dto: MarkAttendanceDto) {
    const { lessonId, studentId, isPresent, absenceType, note } = dto;

    // Validate lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson with ID ${lessonId} not found`);
    }

    // Validate student exists and is in the group
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new BadRequestException(`Student with ID ${studentId} not found`);
    }

    if (student.groupId !== lesson.groupId) {
      throw new BadRequestException('Student is not in this lesson\'s group');
    }

    // If absent, absenceType is required
    if (!isPresent && !absenceType) {
      throw new BadRequestException('Absence type is required when marking absent');
    }

    // Upsert attendance
    const attendance = await this.prisma.attendance.upsert({
      where: {
        lessonId_studentId: { lessonId, studentId },
      },
      update: {
        isPresent,
        absenceType: isPresent ? null : absenceType,
        note,
        markedAt: new Date(),
      },
      create: {
        lessonId,
        studentId,
        isPresent,
        absenceType: isPresent ? null : absenceType,
        note,
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Check if student has too many unjustified absences (for notifications)
    if (!isPresent && absenceType === 'UNJUSTIFIED') {
      await this.checkAbsenceThreshold(studentId);
    }

    // Check if all students have attendance marked, then mark absence as complete
    const lessonWithAttendances = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            students: true,
          },
        },
        attendances: true,
      },
    });

    if (lessonWithAttendances) {
      const studentCount = lessonWithAttendances.group.students.length;
      const attendanceCount = lessonWithAttendances.attendances.length;
      
      // If all students have attendance marked, update lesson.absenceMarked
      if (studentCount > 0 && attendanceCount >= studentCount && !lessonWithAttendances.absenceMarked) {
        await this.prisma.lesson.update({
          where: { id: lessonId },
          data: {
            absenceMarked: true,
            absenceMarkedAt: new Date(),
          },
        });

        // Trigger salary recalculation for the lesson's month
        if (lessonWithAttendances.scheduledAt) {
          const lessonMonth = new Date(lessonWithAttendances.scheduledAt);
          await this.salariesService.recalculateSalaryForMonth(
            lessonWithAttendances.teacherId,
            lessonMonth,
          );
        }
      }
    }

    return attendance;
  }

  async markBulkAttendance(dto: BulkAttendanceDto) {
    const { lessonId, attendances } = dto;

    // Validate lesson
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson with ID ${lessonId} not found`);
    }

    // Process each attendance
    const results = await Promise.all(
      attendances.map((item) =>
        this.markAttendance({
          lessonId,
          studentId: item.studentId,
          isPresent: item.isPresent,
          absenceType: item.absenceType,
          note: item.note,
        }),
      ),
    );

    return {
      success: true,
      count: results.length,
      attendances: results,
    };
  }

  async updateAbsenceType(attendanceId: string, absenceType: AbsenceType, note?: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${attendanceId} not found`);
    }

    if (attendance.isPresent) {
      throw new BadRequestException('Cannot set absence type for present student');
    }

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: { absenceType, note },
    });
  }

  async getGroupAttendanceReport(groupId: string, dateFrom: Date, dateTo: Date) {
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

  async getAtRiskStudents(maxUnjustifiedAbsences = 3) {
    // Get system settings for threshold
    const settings = await this.prisma.systemSettings.findFirst();
    const threshold = settings?.maxUnjustifiedAbsences ?? maxUnjustifiedAbsences;

    // Find students with too many unjustified absences in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const atRiskStudents = await this.prisma.student.findMany({
      where: {
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

  private async checkAbsenceThreshold(studentId: string) {
    const settings = await this.prisma.systemSettings.findFirst();
    const threshold = settings?.maxUnjustifiedAbsences ?? 3;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const unjustifiedCount = await this.prisma.attendance.count({
      where: {
        studentId,
        isPresent: false,
        absenceType: 'UNJUSTIFIED',
        lesson: {
          scheduledAt: { gte: oneMonthAgo },
        },
      },
    });

    if (unjustifiedCount >= threshold) {
      // Create notification for admin
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          group: { select: { name: true } },
        },
      });

      if (student) {
        // Get all admins
        const admins = await this.prisma.user.findMany({
          where: { role: 'ADMIN' },
        });

        // Create notifications
        await this.prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'absence_warning',
            title: 'Student Absence Alert',
            content: `${student.user.firstName} ${student.user.lastName} (${student.group?.name}) has ${unjustifiedCount} unjustified absences in the last month.`,
            data: {
              studentId,
              unjustifiedCount,
              threshold,
            },
          })),
        });
      }
    }
  }
}

