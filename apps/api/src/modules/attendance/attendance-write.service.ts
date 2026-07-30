import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto, BulkAttendanceDto } from './dto';
import { AbsenceType, UserRole } from '@ilona/database';
import { SalariesService } from '../finance/salaries.service';
import { effectiveLessonInstructorTeacherId, teacherCanActOnLesson } from '../../common/lesson-instructor';
import { AttendanceScopeService } from './attendance-scope.service';
import { AttendanceSideEffectsService } from './attendance-side-effects.service';
import { updateStudentStreakOnAttendanceChange } from './attendance.util';
import { isLessonAbsenceChecklistComplete } from './attendance-absence-completion.util';
import type { Prisma } from '@ilona/database';

@Injectable()
export class AttendanceWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: AttendanceScopeService,
    private readonly sideEffects: AttendanceSideEffectsService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}
  async markAttendance(dto: MarkAttendanceDto, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.scope.getManagerCenterId(userId, userRole);
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
            secondTeacherId: true,
            centerId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson with ID ${lessonId} not found`);
    }

    // Authorization: either group teacher may mark attendance; pay stays on assigned instructor
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || !teacherCanActOnLesson(lesson, teacher.id)) {
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

    const {
      attendance,
      lessonCompletedForAbsence,
      lessonScheduledAt,
      lessonTeacherId,
    } = await this.prisma.$transaction(async (tx) => {
      const attendanceRecord = await tx.attendance.upsert({
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

      await updateStudentStreakOnAttendanceChange(
        tx,
        studentId,
        isPresent,
      );

      const lessonWithAttendances = await tx.lesson.findUnique({
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

      const syncResult = lessonWithAttendances
        ? await this.syncLessonAbsenceMarkedInTx(tx, lessonWithAttendances)
        : { newlyCompleted: false };
      const lessonCompletedForAbsence = syncResult.newlyCompleted;

      return {
        attendance: attendanceRecord,
        lessonCompletedForAbsence,
        lessonScheduledAt: lessonWithAttendances?.scheduledAt ?? null,
        lessonTeacherId: lessonWithAttendances
        ? effectiveLessonInstructorTeacherId(lessonWithAttendances)
        : null,
      };
    });

    // Check if student has too many unjustified absences (for notifications)
    if (!isPresent && absenceType === 'UNJUSTIFIED') {
      await this.sideEffects.checkAbsenceThreshold(studentId);
    }

    // Trigger salary recalculation for the lesson's month when attendance becomes complete.
    if (lessonCompletedForAbsence && lessonScheduledAt && lessonTeacherId) {
      const lessonMonth = new Date(lessonScheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        lessonTeacherId,
        lessonMonth,
      );
    }

    return attendance;
  }

  async markBulkAttendance(dto: BulkAttendanceDto, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.scope.getManagerCenterId(userId, userRole);
    const { lessonId, attendances } = dto;

    // Validate lesson
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          select: {
            id: true,
            teacherId: true,
            secondTeacherId: true,
            centerId: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new BadRequestException(`Lesson with ID ${lessonId} not found`);
    }

    // Authorization: either group teacher may mark attendance; pay stays on assigned instructor
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || !teacherCanActOnLesson(lesson, teacher.id)) {
        throw new ForbiddenException('You do not have access to this lesson');
      }
    }

    if (managerCenterId && lesson.group.centerId !== managerCenterId) {
      throw new ForbiddenException('You do not have access to this lesson');
    }

    // Process each attendance (parallel saves); sync completion once after all writes.
    const results = await Promise.all(
      attendances.map((item) =>
        this.markAttendance({
          lessonId,
          studentId: item.studentId,
          isPresent: item.isPresent,
          absenceType: item.absenceType,
          note: item.note,
        }, userId, userRole),
      ),
    );

    const { lessonCompletedForAbsence, lessonScheduledAt, lessonTeacherId } =
      await this.syncLessonAbsenceMarked(lessonId);

    if (lessonCompletedForAbsence && lessonScheduledAt && lessonTeacherId) {
      const lessonMonth = new Date(lessonScheduledAt);
      await this.salariesService.recalculateSalaryForMonth(lessonTeacherId, lessonMonth);
    }

    return {
      success: true,
      count: results.length,
      attendances: results,
    };
  }

  private async syncLessonAbsenceMarkedInTx(
    tx: Prisma.TransactionClient,
    lesson: {
      id: string;
      absenceMarked: boolean;
      group: { students: { id: string }[] };
      attendances: { studentId: string }[];
    },
  ): Promise<{ newlyCompleted: boolean }> {
    const groupStudentIds = lesson.group.students.map((student) => student.id);
    const attendanceStudentIds = lesson.attendances.map((attendance) => attendance.studentId);
    const allMarked = isLessonAbsenceChecklistComplete(groupStudentIds, attendanceStudentIds);

    if (allMarked && !lesson.absenceMarked) {
      await tx.lesson.update({
        where: { id: lesson.id },
        data: {
          absenceMarked: true,
          absenceMarkedAt: new Date(),
        },
      });
      return { newlyCompleted: true };
    }

    if (!allMarked && lesson.absenceMarked) {
      await tx.lesson.update({
        where: { id: lesson.id },
        data: {
          absenceMarked: false,
          absenceMarkedAt: null,
        },
      });
    }

    return { newlyCompleted: false };
  }

  private async syncLessonAbsenceMarked(lessonId: string): Promise<{
    lessonCompletedForAbsence: boolean;
    lessonScheduledAt: Date | null;
    lessonTeacherId: string | null;
  }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            students: { select: { id: true } },
          },
        },
        attendances: { select: { studentId: true } },
      },
    });

    if (!lesson) {
      return {
        lessonCompletedForAbsence: false,
        lessonScheduledAt: null,
        lessonTeacherId: null,
      };
    }

    const syncResult = await this.prisma.$transaction((tx) =>
      this.syncLessonAbsenceMarkedInTx(tx, lesson),
    );

    return {
      lessonCompletedForAbsence: syncResult.newlyCompleted,
      lessonScheduledAt: lesson.scheduledAt,
      lessonTeacherId: effectiveLessonInstructorTeacherId(lesson),
    };
  }

  async updateAbsenceType(attendanceId: string, absenceType: AbsenceType, note?: string, userId?: string, userRole?: UserRole) {
    const managerCenterId = await this.scope.getManagerCenterId(userId, userRole);
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        lesson: {
          include: {
            group: {
              select: {
                id: true,
                teacherId: true,
                secondTeacherId: true,
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

    // Authorization: either group teacher may update attendance; pay stays on assigned instructor
    if (userRole === UserRole.TEACHER && userId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher || !teacherCanActOnLesson(attendance.lesson, teacher.id)) {
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

}
