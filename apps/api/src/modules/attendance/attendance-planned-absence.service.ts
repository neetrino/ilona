import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole, LessonStatus } from '@ilona/database';
import { AttendanceScopeService } from './attendance-scope.service';
import { AttendanceSideEffectsService } from './attendance-side-effects.service';
import { isPlannedAbsencesTableMissing } from './attendance.util';

@Injectable()
export class AttendancePlannedAbsenceService {
  private readonly logger = new Logger(AttendancePlannedAbsenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: AttendanceScopeService,
    private readonly sideEffects: AttendanceSideEffectsService,
  ) {}
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
        await this.sideEffects.notifyStaffOfPlannedAbsence(student, dateStr, comment);
      }

      return {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        status: record.status,
        comment: record.comment,
      };
    } catch (err) {
      if (isPlannedAbsencesTableMissing(err)) {
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
      if (isPlannedAbsencesTableMissing(err)) {
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
      const centerId = await this.scope.getManagerCenterId(userId, userRole);
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
