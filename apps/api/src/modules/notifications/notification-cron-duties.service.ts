import { Injectable } from '@nestjs/common';
import {
  APP_TIMEZONE,
  buildDutyActionStatuses,
  isDutyDeadlinePassed,
} from '@ilona/types';
import { LessonStatus } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationRecipientsService } from './notification-recipients.service';
import { NotificationWriteService } from './notification-write.service';
import { zonedDayRange } from './notification-cron.util';

type DutyLesson = {
  id: string;
  scheduledAt: Date;
  duration: number;
  absenceMarked: boolean;
  absenceMarkedAt: Date | null;
  feedbacksCompleted: boolean;
  feedbacksCompletedAt: Date | null;
  voiceSent: boolean;
  voiceSentAt: Date | null;
  textSent: boolean;
  textSentAt: Date | null;
  dailyPlan: { id: string; createdAt: Date } | null;
  group: { name: string; centerId: string };
  teacher: { user: { firstName: string; lastName: string } };
};

@Injectable()
export class NotificationCronDutiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly write: NotificationWriteService,
    private readonly recipients: NotificationRecipientsService,
  ) {}

  async sendDailyBranchReports(now = new Date()): Promise<number> {
    const { start, end, ymd } = zonedDayRange(now);
    const lessons = await this.loadLessons(start, end);
    const byCenter = this.groupIncompleteByCenter(lessons);
    let created = 0;
    for (const [centerId, lines] of byCenter) {
      if (lines.length === 0) {
        continue;
      }
      const userIds = await this.recipients.findStaffUserIdsForCenter(centerId);
      created += await this.write.createForUsers({
        userIds,
        type: 'DAILY_BRANCH_REPORT',
        title: 'Daily branch report',
        content: lines.slice(0, 8).join('\n'),
        data: { centerId, href: '/admin/daily-duties' },
        dedupeKey: `${centerId}:${ymd}`,
      });
    }
    return created;
  }

  async sendMissedDeadlines(now = new Date()): Promise<number> {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { start, end, ymd } = zonedDayRange(yesterday);
    const lessons = await this.loadLessons(start, end);
    let created = 0;
    for (const lesson of lessons) {
      if (!isDutyDeadlinePassed(lesson.scheduledAt, now, APP_TIMEZONE)) {
        continue;
      }
      const incomplete = this.incompleteLabels(lesson);
      if (incomplete.length === 0) {
        continue;
      }
      const teacherName = `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`;
      const userIds = await this.recipients.findStaffUserIdsForCenter(lesson.group.centerId);
      created += await this.write.createForUsers({
        userIds,
        type: 'TEACHER_MISSED_DEADLINE',
        title: 'Teacher missed deadline',
        content: `${teacherName} did not complete ${incomplete.join(', ')} for ${lesson.group.name}.`,
        data: { lessonId: lesson.id, href: `/admin/daily-duties/${lesson.id}` },
        dedupeKey: `${lesson.id}:${ymd}`,
      });
    }
    return created;
  }

  private async loadLessons(start: Date, end: Date): Promise<DutyLesson[]> {
    return this.prisma.lesson.findMany({
      where: {
        scheduledAt: { gte: start, lt: end },
        status: { not: LessonStatus.CANCELLED },
      },
      select: {
        id: true,
        scheduledAt: true,
        duration: true,
        absenceMarked: true,
        absenceMarkedAt: true,
        feedbacksCompleted: true,
        feedbacksCompletedAt: true,
        voiceSent: true,
        voiceSentAt: true,
        textSent: true,
        textSentAt: true,
        dailyPlan: { select: { id: true, createdAt: true } },
        group: { select: { name: true, centerId: true } },
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  private groupIncompleteByCenter(lessons: DutyLesson[]): Map<string, string[]> {
    const byCenter = new Map<string, string[]>();
    for (const lesson of lessons) {
      const labels = this.incompleteLabels(lesson);
      if (labels.length === 0) {
        continue;
      }
      const teacherName = `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`;
      const line = `${lesson.group.name} (${teacherName}): ${labels.join(', ')}`;
      const list = byCenter.get(lesson.group.centerId) ?? [];
      list.push(line);
      byCenter.set(lesson.group.centerId, list);
    }
    return byCenter;
  }

  private incompleteLabels(lesson: DutyLesson): string[] {
    const statuses = buildDutyActionStatuses(lesson);
    const labels: string[] = [];
    if (!statuses.absence.completed) labels.push('attendance');
    if (!statuses.feedbacks.completed) labels.push('feedback');
    if (!statuses.voice.completed) labels.push('voice');
    if (!statuses.text.completed) labels.push('text');
    if (!statuses.dailyPlan.completed) labels.push('daily plan');
    return labels;
  }
}
