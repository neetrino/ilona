import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, LessonStatus } from '@ilona/database';
import { toYmd } from '@ilona/types';
import { isPlannedAbsencesTableMissing } from './attendance.util';

function calendarDateToPrismaDate(ymd: string): Date {
  return new Date(`${toYmd(ymd)}T12:00:00.000Z`);
}

@Injectable()
export class AttendanceStudentQueryService {
  private readonly logger = new Logger(AttendanceStudentQueryService.name);

  constructor(private readonly prisma: PrismaService) {}
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
        date: toYmd(p.date),
        status: p.status,
        comment: p.comment,
      })),
    };
  }

  private async findPlannedAbsencesForStudentSafe(
    studentId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<Array<{ id: string; date: Date; status: string; comment: string }>> {
    try {
      return await this.prisma.plannedAbsence.findMany({
        where: {
          studentId,
          ...(dateFrom || dateTo
            ? {
                date: {
                  ...(dateFrom && {
                    gte: calendarDateToPrismaDate(toYmd(dateFrom)),
                  }),
                  ...(dateTo && {
                    lte: calendarDateToPrismaDate(toYmd(dateTo)),
                  }),
                },
              }
            : {}),
        },
        orderBy: { date: 'asc' },
      });
    } catch (err) {
      if (isPlannedAbsencesTableMissing(err)) {
        this.logger.warn(
          'planned_absences table is missing. Run: pnpm db:migrate (repo root, with DATABASE_URL set).',
        );
        return [];
      }
      throw err;
    }
  }
}
