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
import { effectiveLessonInstructorTeacherId, teacherActsAsLessonInstructor } from '../../common/lesson-instructor';
import { AttendanceScopeService } from './attendance-scope.service';
import { AttendanceSideEffectsService } from './attendance-side-effects.service';
import { updateStudentStreakOnAttendanceChange } from './attendance.util';

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

      if (!teacher || !teacherActsAsLessonInstructor(lesson, teacher.id)) {
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

      let lessonCompletedForAbsence = false;
      if (lessonWithAttendances) {
        const studentCount = lessonWithAttendances.group.students.length;
        const attendanceCount = lessonWithAttendances.attendances.length;
        if (studentCount > 0 && attendanceCount >= studentCount && !lessonWithAttendances.absenceMarked) {
          await tx.lesson.update({
            where: { id: lessonId },
            data: {
              absenceMarked: true,
              absenceMarkedAt: new Date(),
            },
          });
          lessonCompletedForAbsence = true;
        }
      }

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

      if (!teacher || !teacherActsAsLessonInstructor(lesson, teacher.id)) {
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
        }, userId, userRole),
      ),
    );

    return {
      success: true,
      count: results.length,
      attendances: results,
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

      if (!teacher || !teacherActsAsLessonInstructor(attendance.lesson, teacher.id)) {
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
