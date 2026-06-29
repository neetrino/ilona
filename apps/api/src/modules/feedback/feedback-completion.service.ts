import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from '../finance/salaries.service';
import { effectiveLessonInstructorTeacherId } from '../../common/lesson-instructor';

@Injectable()
export class FeedbackCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SalariesService))
    private readonly salariesService: SalariesService,
  ) {}

  async syncLessonFeedbacksCompleted(lessonId: string): Promise<void> {
    const lessonWithGroup = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: { include: { students: true } },
        feedbacks: true,
      },
    });

    if (!lessonWithGroup) return;

    const studentCount = lessonWithGroup.group.students.length;
    const feedbackCount = lessonWithGroup.feedbacks.length;
    const wasCompleted = lessonWithGroup.feedbacksCompleted;
    const allComplete = studentCount > 0 && feedbackCount >= studentCount;
    const shouldBeCompleted = allComplete;
    const statusChanged = wasCompleted !== shouldBeCompleted;

    if (!statusChanged) return;

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        feedbacksCompleted: shouldBeCompleted,
        feedbacksCompletedAt: shouldBeCompleted
          ? (lessonWithGroup.feedbacksCompletedAt ?? new Date())
          : null,
      },
    });

    if (lessonWithGroup.scheduledAt) {
      const lessonMonth = new Date(lessonWithGroup.scheduledAt);
      await this.salariesService.recalculateSalaryForMonth(
        effectiveLessonInstructorTeacherId(lessonWithGroup),
        lessonMonth,
      );
    }
  }
}
