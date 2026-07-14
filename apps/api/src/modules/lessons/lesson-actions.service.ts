import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from '../finance/salaries.service';
import { LessonCrudService } from './lesson-crud.service';
import { UserRole } from '@ilona/database';
import { effectiveLessonInstructorTeacherId } from '../../common/lesson-instructor';
import { isLessonAbsenceChecklistComplete } from '../attendance/attendance-absence-completion.util';

type LessonActionFields = {
  voiceSent?: boolean;
  textSent?: boolean;
  scheduledAt?: Date | string | null;
  teacherId: string;
  substituteTeacherId: string | null | undefined;
};

/**
 * Service responsible for lesson action completion
 */
@Injectable()
export class LessonActionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
    private readonly crudService: LessonCrudService,
  ) {}

  async markVocabularySent(id: string): Promise<unknown> {
    // Verify lesson exists
    await this.crudService.findById(id);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        vocabularySent: true,
        vocabularySentAt: new Date(),
      },
    });
  }

  async markAbsenceComplete(
    id: string,
    userId?: string,
    userRole?: UserRole,
  ): Promise<unknown> {
    // Verify lesson exists and get lesson data
    await this.crudService.findById(id, userId, userRole);

    const lessonWithAttendance = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            students: { select: { id: true } },
          },
        },
        attendances: { select: { studentId: true } },
      },
    });

    if (!lessonWithAttendance) {
      throw new BadRequestException(`Lesson with ID ${id} not found`);
    }

    const groupStudentIds = lessonWithAttendance.group.students.map((student) => student.id);
    const attendanceStudentIds = lessonWithAttendance.attendances.map(
      (attendance) => attendance.studentId,
    );

    if (!isLessonAbsenceChecklistComplete(groupStudentIds, attendanceStudentIds)) {
      throw new BadRequestException(
        'Attendance must be saved for every student in the group before completing absences',
      );
    }

    const wasAlreadyMarked = lessonWithAttendance.absenceMarked;
    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        absenceMarked: true,
        absenceMarkedAt: new Date(),
      },
    });

    // Trigger salary recalculation if this is a new completion
    if (!wasAlreadyMarked && lessonWithAttendance.scheduledAt) {
      const lessonMonth = new Date(lessonWithAttendance.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        effectiveLessonInstructorTeacherId(lessonWithAttendance),
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }

  async markVoiceSent(id: string, userId?: string, userRole?: UserRole): Promise<unknown> {
    // Verify lesson exists and get lesson data
    const lesson = (await this.crudService.findById(id, userId, userRole)) as LessonActionFields;

    const wasAlreadySent = lesson.voiceSent;
    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        voiceSent: true,
        voiceSentAt: new Date(),
      },
    });

    // Trigger salary recalculation if this is a new completion
    if (!wasAlreadySent && lesson.scheduledAt) {
      const lessonMonth = new Date(lesson.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        effectiveLessonInstructorTeacherId(lesson),
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }

  async markTextSent(id: string, userId?: string, userRole?: UserRole): Promise<unknown> {
    // Verify lesson exists and get lesson data
    const lesson = (await this.crudService.findById(id, userId, userRole)) as LessonActionFields;

    const wasAlreadySent = lesson.textSent;
    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        textSent: true,
        textSentAt: new Date(),
      },
    });

    // Trigger salary recalculation if this is a new completion
    if (!wasAlreadySent && lesson.scheduledAt) {
      const lessonMonth = new Date(lesson.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        effectiveLessonInstructorTeacherId(lesson),
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }
}






