import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from '../finance/salaries.service';
import { LessonCrudService } from './lesson-crud.service';

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

  async markVocabularySent(id: string) {
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

  async markAbsenceComplete(id: string) {
    // Verify lesson exists and get lesson data
    const lesson = await this.crudService.findById(id);

    const wasAlreadyMarked = lesson.absenceMarked;
    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        absenceMarked: true,
        absenceMarkedAt: new Date(),
      },
    });

    // Trigger salary recalculation if this is a new completion
    if (!wasAlreadyMarked && lesson.scheduledAt) {
      const lessonMonth = new Date(lesson.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        lesson.teacherId,
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }

  async markVoiceSent(id: string) {
    // Verify lesson exists and get lesson data
    const lesson = await this.crudService.findById(id);

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
        lesson.teacherId,
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }

  async markTextSent(id: string) {
    // Verify lesson exists and get lesson data
    const lesson = await this.crudService.findById(id);

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
        lesson.teacherId,
        lessonMonth,
      ).catch(() => {
        // Silently fail to avoid breaking the update
      });
    }

    return updated;
  }
}

