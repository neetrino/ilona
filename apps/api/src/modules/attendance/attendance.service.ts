import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto, BulkAttendanceDto } from './dto';
import { Prisma, AbsenceType, UserRole, LessonStatus } from '@ilona/database';
import { SalariesService } from '../finance/salaries.service';
import { StudentStreakService } from '../students/student-streak.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  /** True when `planned_absences` migration has not been applied (Prisma P2021). */
  private isPlannedAbsencesTableMissing(err: unknown): boolean {
    return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021';
  }

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
    private readonly streakService: StudentStreakService,
  ) {}

  private async getManagerCenterId(userId?: string, userRole?: UserRole): Promise<string | null> {
    if (userRole !== UserRole.MANAGER || !userId) {
      return null;
    }

    const managerProfile = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
      SELECT "centerId" FROM "manager_profiles" WHERE "userId" = ${userId} LIMIT 1
    `;

    const managerCenterId = managerProfile[0]?.centerId;
    if (!managerCenterId) {
      throw new ForbiddenException('Manager account is not assigned to a center');
    }

    return managerCenterId;
  }

  async getByLesson(lessonId: string, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.getManagerCenterId(userId, userRole);
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
            markedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
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

    // Authorization: Teachers can only access lessons for their assigned groups
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || lesson.group.teacherId !== teacher.id) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    if (managerCenterId && lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lesson');
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

  /**
   * Get attendance for multiple lessons in one request (batch). Returns a map of lessonId -> lesson attendance.
   * Lessons not found or not authorized are omitted from the result.
   */
  async getByLessons(lessonIds: string[], userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.getManagerCenterId(userId, userRole);
    if (!lessonIds || lessonIds.length === 0) {
      return {};
    }
    const uniqueIds = [...new Set(lessonIds)];
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: uniqueIds } },
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
            markedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
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

    let teacherId: string | null = null;
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });
      teacherId = teacher?.id ?? null;
    }

    const result: Record<string, Awaited<ReturnType<AttendanceService['getByLesson']>>> = {};
    for (const lesson of lessons) {
      if (teacherId !== null && lesson.group.teacherId !== teacherId) {
        continue;
      }
      if (managerCenterId && lesson.group.centerId !== managerCenterId) {
        continue;
      }
      const studentsWithAttendance = lesson.group.students.map((student) => {
        const attendance = lesson.attendances.find((a) => a.studentId === student.id);
        return {
          student,
          attendance: attendance || null,
        };
      });
      result[lesson.id] = {
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
    return result;
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
        markedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
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

  async markAttendance(dto: MarkAttendanceDto, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.getManagerCenterId(userId, userRole);
    const { lessonId, studentId, isPresent, absenceType, note: rawNote } = dto;
    const note = rawNote?.trim() || undefined;

    // Validate lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          select: {
            id: true,
            teacherId: true,
            centerId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson with ID ${lessonId} not found`);
    }

    // Authorization: Teachers can only mark attendance for their assigned groups
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || lesson.group.teacherId !== teacher.id) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    if (managerCenterId && lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lesson');
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
    if (!isPresent && absenceType === AbsenceType.JUSTIFIED && !note) {
      throw new BadRequestException('Justification comment is required when marking justified absence');
    }

    // Upsert attendance
    const attendance = await this.prisma.attendance.upsert({
      where: {
        lessonId_studentId: { lessonId, studentId },
      },
      update: {
        isPresent,
        absenceType: isPresent ? null : absenceType,
        note: isPresent ? null : note ?? null,
        markedById: userId ?? null,
        markedAt: new Date(),
      },
      create: {
        lessonId,
        studentId,
        isPresent,
        absenceType: isPresent ? null : absenceType,
        note: isPresent ? null : note ?? null,
        markedById: userId ?? null,
      },
      include: {
        markedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
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

    // Refresh streak so it reflects the latest attendance event.
    try {
      await this.streakService.recomputeStreak(studentId);
    } catch (err) {
      this.logger.warn(`Streak recompute failed for student ${studentId}: ${String(err)}`);
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

  async markBulkAttendance(dto: BulkAttendanceDto, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.getManagerCenterId(userId, userRole);
    const { lessonId, attendances } = dto;

    // Validate lesson
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          select: {
            id: true,
            teacherId: true,
            centerId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson with ID ${lessonId} not found`);
    }

    // Authorization: Teachers can only mark attendance for their assigned groups
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || lesson.group.teacherId !== teacher.id) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    if (managerCenterId && lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lesson');
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

  async updateAbsenceType(attendanceId: string, absenceType: AbsenceType, note?: string, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.getManagerCenterId(userId, userRole);
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        lesson: {
          include: {
            group: {
              select: {
                id: true,
                teacherId: true,
                centerId: true,
              },
            },
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${attendanceId} not found`);
    }

    // Authorization: Teachers can only update attendance for their assigned groups
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || attendance.lesson.group.teacherId !== teacher.id) {
        throw new ForbiddenException('You do not have access to this attendance record');
      }
    }

    if (managerCenterId && attendance.lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this attendance record');
    }

    if (attendance.isPresent) {
      throw new BadRequestException('Cannot set absence type for present student');
    }
    const normalizedNote = note?.trim() || undefined;
    if (absenceType === AbsenceType.JUSTIFIED && !normalizedNote) {
      throw new BadRequestException('Justification comment is required when marking justified absence');
    }

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        absenceType,
        note: normalizedNote ?? null,
        markedById: userId ?? null,
      },
    });
  }

  async getGroupAttendanceReport(groupId: string, dateFrom: Date, dateTo: Date, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.getManagerCenterId(userId, userRole);
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

    const managerCenterId = await this.getManagerCenterId(currentUser?.sub, currentUser?.role);

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

  /**
   * P2021: table missing until `pnpm db:migrate` — avoid 500 on student calendar.
   */
  private async findPlannedAbsencesForStudentSafe(
    studentId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<
    Array<{ id: string; date: Date; status: string; comment: string }>
  > {
    try {
      return await this.prisma.plannedAbsence.findMany({
        where: {
          studentId,
          ...(dateFrom || dateTo
            ? {
                date: {
                  ...(dateFrom && {
                    gte: new Date(dateFrom.toISOString().split('T')[0]),
                  }),
                  ...(dateTo && {
                    lte: new Date(dateTo.toISOString().split('T')[0]),
                  }),
                },
              }
            : {}),
        },
        orderBy: { date: 'asc' },
      });
    } catch (err) {
      if (this.isPlannedAbsencesTableMissing(err)) {
        this.logger.warn(
          'planned_absences table is missing. Run: pnpm db:migrate (repo root, with DATABASE_URL set).',
        );
        return [];
      }
      throw err;
    }
  }

  async getStudentCalendarMonth(
    studentId: string,
    params?: { dateFrom?: Date; dateTo?: Date },
  ) {
    const { dateFrom, dateTo } = params || {};

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, groupId: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const attendancePayload = await this.getByStudent(studentId, { dateFrom, dateTo });

    const lessonWhere: Prisma.LessonWhereInput = {
      status: { notIn: [LessonStatus.CANCELLED, LessonStatus.REPLACED] },
      ...(student.groupId ? { groupId: student.groupId } : { id: { in: [] } }),
      ...(dateFrom || dateTo
        ? {
            scheduledAt: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    };

    const [lessons, plannedAbsences] = await Promise.all([
      student.groupId
        ? this.prisma.lesson.findMany({
            where: lessonWhere,
            select: {
              id: true,
              scheduledAt: true,
              topic: true,
              group: { select: { id: true, name: true } },
            },
            orderBy: { scheduledAt: 'asc' },
          })
        : Promise.resolve([]),
      this.findPlannedAbsencesForStudentSafe(studentId, dateFrom, dateTo),
    ]);

    return {
      lessons,
      attendances: attendancePayload.attendances,
      statistics: attendancePayload.statistics,
      plannedAbsences: plannedAbsences.map((p) => ({
        id: p.id,
        date: p.date.toISOString().split('T')[0],
        status: p.status,
        comment: p.comment,
      })),
    };
  }

  async createPlannedAbsenceForStudentUser(userId: string, dateStr: string, rawComment: string) {
    const comment = rawComment.trim();
    if (!comment) {
      throw new BadRequestException('Comment is required');
    }

    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        group: { select: { id: true, name: true, teacherId: true, centerId: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    if (!student.groupId || !student.group) {
      throw new BadRequestException('You are not assigned to a group yet');
    }

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const lessonsOnDay = await this.prisma.lesson.findMany({
      where: {
        groupId: student.groupId,
        status: { notIn: [LessonStatus.CANCELLED, LessonStatus.REPLACED] },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
    });

    if (lessonsOnDay.length === 0) {
      throw new BadRequestException('There is no scheduled class on this date');
    }

    const now = new Date();
    const hasUpcomingLessonOnDay = lessonsOnDay.some((l) => new Date(l.scheduledAt) > now);
    if (!hasUpcomingLessonOnDay) {
      throw new BadRequestException('You can only report absence for upcoming class days');
    }

    try {
      const existingRow = await this.prisma.plannedAbsence.findUnique({
        where: {
          studentId_date: {
            studentId: student.id,
            date: dayStart,
          },
        },
      });

      const record = await this.prisma.plannedAbsence.upsert({
        where: {
          studentId_date: {
            studentId: student.id,
            date: dayStart,
          },
        },
        create: {
          studentId: student.id,
          date: dayStart,
          comment,
          status: 'planned_absence',
        },
        update: {
          comment,
          status: 'planned_absence',
        },
      });

      if (!existingRow) {
        await this.notifyStaffOfPlannedAbsence(student, dateStr, comment);
      }

      return {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        status: record.status,
        comment: record.comment,
      };
    } catch (err) {
      if (this.isPlannedAbsencesTableMissing(err)) {
        this.logger.warn('planned_absences table is missing. Run: pnpm db:migrate');
        throw new BadRequestException(
          'Planned absences are not available until the database is migrated (run pnpm db:migrate on the server).',
        );
      }
      throw err;
    }
  }

  async deleteMyPlannedAbsence(userId: string, plannedAbsenceId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    try {
      const existing = await this.prisma.plannedAbsence.findFirst({
        where: { id: plannedAbsenceId, studentId: student.id },
      });
      if (!existing) {
        throw new NotFoundException('Planned absence not found');
      }

      await this.prisma.plannedAbsence.delete({ where: { id: plannedAbsenceId } });
      return { success: true };
    } catch (err) {
      if (this.isPlannedAbsencesTableMissing(err)) {
        this.logger.warn('planned_absences table is missing. Run: pnpm db:migrate');
        throw new BadRequestException(
          'Planned absences are not available until the database is migrated (run pnpm db:migrate on the server).',
        );
      }
      throw err;
    }
  }

  async listPlannedAbsencesForStaff(
    dateFrom: Date,
    dateTo: Date,
    userId: string,
    userRole: UserRole,
  ) {
    const fromD = new Date(dateFrom.toISOString().split('T')[0]);
    const toD = new Date(dateTo.toISOString().split('T')[0]);

    const where: Prisma.PlannedAbsenceWhereInput = {
      date: { gte: fromD, lte: toD },
    };

    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return [];
      }
      where.student = { group: { teacherId: teacher.id } };
    } else if (userRole === UserRole.MANAGER) {
      const centerId = await this.getManagerCenterId(userId, userRole);
      where.student = { group: { centerId: centerId! } };
    } else if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to planned absences');
    }

    try {
      const rows = await this.prisma.plannedAbsence.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } },
              group: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      });

      return rows.map((row) => ({
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        status: row.status,
        comment: row.comment,
        createdAt: row.createdAt.toISOString(),
        student: {
          id: row.student.id,
          name: `${row.student.user.firstName} ${row.student.user.lastName}`,
          email: row.student.user.email,
          group: row.student.group,
        },
      }));
    } catch (err) {
      if (this.isPlannedAbsencesTableMissing(err)) {
        this.logger.warn(
          'planned_absences table is missing. Run: pnpm db:migrate (repo root, with DATABASE_URL set).',
        );
        return [];
      }
      throw err;
    }
  }

  private async notifyStaffOfPlannedAbsence(
    student: {
      id: string;
      user: { firstName: string; lastName: string };
      group: { name: string; teacherId: string | null; centerId: string } | null;
    },
    dateStr: string,
    comment: string,
  ) {
    const groupName = student.group?.name ?? '—';
    const title = 'Planned student absence';
    const content = `${student.user.firstName} ${student.user.lastName} (${groupName}) will be absent on ${dateStr}. Note: ${comment}`;

    const userIds = new Set<string>();

    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    admins.forEach((a) => userIds.add(a.id));

    if (student.group?.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: student.group.teacherId },
        select: { userId: true },
      });
      if (teacher) {
        userIds.add(teacher.userId);
      }
    }

    if (student.group?.centerId) {
      const managers = await this.prisma.managerProfile.findMany({
        where: { centerId: student.group.centerId },
        select: { userId: true },
      });
      managers.forEach((m) => userIds.add(m.userId));
    }

    if (userIds.size === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: [...userIds].map((uid) => ({
        userId: uid,
        type: 'planned_absence',
        title,
        content,
        data: {
          studentId: student.id,
          date: dateStr,
          status: 'planned_absence',
        },
      })),
    });
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

