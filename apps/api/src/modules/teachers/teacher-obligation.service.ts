import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherObligationService {
  constructor(private readonly prisma: PrismaService) {}

  async getObligationDetails(teacherId: string) {
    // Verify teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Fetch all completed lessons for this teacher
    const completedLessons = await this.prisma.lesson.findMany({
      where: {
        teacherId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        absenceMarked: true,
        absenceMarkedAt: true,
        feedbacksCompleted: true,
        voiceSent: true,
        voiceSentAt: true,
        textSent: true,
        textSentAt: true,
        scheduledAt: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Calculate overall statistics
    let totalCompleted = 0;
    let totalRequired = 0;
    const actionCounts = {
      absenceMarked: 0,
      feedbacksCompleted: 0,
      voiceSent: 0,
      textSent: 0,
    };

    completedLessons.forEach(lesson => {
      totalRequired += 4;
      if (lesson.absenceMarked) {
        totalCompleted++;
        actionCounts.absenceMarked++;
      }
      if (lesson.feedbacksCompleted) {
        totalCompleted++;
        actionCounts.feedbacksCompleted++;
      }
      if (lesson.voiceSent) {
        totalCompleted++;
        actionCounts.voiceSent++;
      }
      if (lesson.textSent) {
        totalCompleted++;
        actionCounts.textSent++;
      }
    });

    // Calculate average per lesson for display
    const avgCompletedPerLesson = completedLessons.length > 0
      ? Math.round(totalCompleted / completedLessons.length)
      : 0;

    // Determine which actions are done based on completion rate
    // An action is considered "done" if it's completed in at least 80% of lessons
    const threshold = completedLessons.length > 0 ? Math.ceil(completedLessons.length * 0.8) : 1;
    
    const items = [
      {
        key: 'absenceMarked',
        label: 'Attendance Marked',
        done: actionCounts.absenceMarked >= threshold,
        completedCount: actionCounts.absenceMarked,
        totalCount: completedLessons.length,
        // Get the most recent completion timestamp
        doneAt: completedLessons
          .filter(l => l.absenceMarked && l.absenceMarkedAt)
          .sort((a, b) => new Date(b.absenceMarkedAt!).getTime() - new Date(a.absenceMarkedAt!).getTime())[0]?.absenceMarkedAt?.toISOString(),
      },
      {
        key: 'feedbacksCompleted',
        label: 'Feedback Submitted',
        done: actionCounts.feedbacksCompleted >= threshold,
        completedCount: actionCounts.feedbacksCompleted,
        totalCount: completedLessons.length,
        doneAt: undefined, // Feedback completion doesn't have a timestamp field
      },
      {
        key: 'voiceSent',
        label: 'Voice Message Sent',
        done: actionCounts.voiceSent >= threshold,
        completedCount: actionCounts.voiceSent,
        totalCount: completedLessons.length,
        doneAt: completedLessons
          .filter(l => l.voiceSent && l.voiceSentAt)
          .sort((a, b) => new Date(b.voiceSentAt!).getTime() - new Date(a.voiceSentAt!).getTime())[0]?.voiceSentAt?.toISOString(),
      },
      {
        key: 'textSent',
        label: 'Text Message Sent',
        done: actionCounts.textSent >= threshold,
        completedCount: actionCounts.textSent,
        totalCount: completedLessons.length,
        doneAt: completedLessons
          .filter(l => l.textSent && l.textSentAt)
          .sort((a, b) => new Date(b.textSentAt!).getTime() - new Date(a.textSentAt!).getTime())[0]?.textSentAt?.toISOString(),
      },
    ];

    return {
      total: 4,
      completed: avgCompletedPerLesson,
      items,
    };
  }
}




