import { Injectable } from '@nestjs/common';
import { LessonStatus, PaymentStatus, RiskLabel } from '@ilona/database';
import { evaluateStudentAtRisk } from '../students/student-at-risk.util';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { NotificationRecipientsService } from './notification-recipients.service';
import { NotificationWriteService } from './notification-write.service';
import { zonedDayRange } from './notification-cron.util';
import {
  buildStudentRecordingChatHref,
  buildStudentRecordingCopy,
  formatStudentRecordingLessonLabel,
  resolveStudentRecordingTeacherUserId,
  studentRecordingLessonSelect,
} from './student-recording-notification.util';

const LATE_THRESHOLD = 3;

@Injectable()
export class NotificationCronStudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly write: NotificationWriteService,
    private readonly recipients: NotificationRecipientsService,
    private readonly email: EmailService,
  ) {}

  async sendFrequentLateAlerts(now = new Date()): Promise<number> {
    const since = new Date(now);
    since.setDate(since.getDate() - 30);
    const grouped = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      where: { isLate: true, markedAt: { gte: since } },
      _count: { studentId: true },
    });

    let created = 0;
    for (const row of grouped) {
      const lateCount = row._count.studentId;
      if (lateCount < LATE_THRESHOLD) {
        continue;
      }
      created += await this.notifyLateStudent(row.studentId, lateCount);
    }
    return created;
  }

  async sendMissingRecordingReminders(now = new Date()): Promise<number> {
    const { start, end, ymd } = zonedDayRange(now);
    const lessons = await this.prisma.lesson.findMany({
      where: {
        scheduledAt: { gte: start, lt: end },
        status: { not: LessonStatus.CANCELLED },
      },
      select: {
        id: true,
        ...studentRecordingLessonSelect,
        group: {
          select: {
            id: true,
            name: true,
            students: {
              select: {
                id: true,
                user: { select: { id: true, email: true, firstName: true } },
              },
            },
          },
        },
        recordingItems: { select: { studentId: true } },
      },
    });

    let created = 0;
    for (const lesson of lessons) {
      const teacherUserId = resolveStudentRecordingTeacherUserId(lesson);
      if (!teacherUserId) {
        continue;
      }

      const lessonLabel = formatStudentRecordingLessonLabel(lesson);
      const sent = new Set(lesson.recordingItems.map((item) => item.studentId));
      for (const student of lesson.group.students) {
        if (sent.has(student.id)) {
          continue;
        }
        created += await this.notifyMissingRecording({
          student,
          lessonId: lesson.id,
          groupId: lesson.group.id,
          teacherUserId,
          lessonLabel,
          ymd,
        });
      }
    }
    return created;
  }

  async sendChurnAlerts(now = new Date()): Promise<number> {
    const { ymd } = zonedDayRange(now);
    const students = await this.prisma.student.findMany({
      select: {
        id: true,
        group: { select: { name: true, centerId: true } },
        user: { select: { firstName: true, lastName: true } },
        attendances: {
          where: { isPresent: false },
          select: { id: true },
        },
        payments: {
          where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } },
          select: { id: true },
        },
      },
    });

    let created = 0;
    for (const student of students) {
      const evaluation = evaluateStudentAtRisk({
        absenceCount: student.attendances.length,
        hasLatePayment: student.payments.length > 0,
      });
      if (evaluation.riskLabel === RiskLabel.NONE) {
        continue;
      }
      const name = `${student.user.firstName} ${student.user.lastName}`;
      const userIds = await this.recipients.findStaffUserIdsForCenter(student.group?.centerId);
      created += await this.write.createForUsers({
        userIds,
        type: 'STUDENT_CHURN_RISK',
        title: 'Student churn warning',
        content: `${name}${student.group ? ` (${student.group.name})` : ''} is at risk.`,
        data: { studentId: student.id, href: `/admin/students/${student.id}` },
        dedupeKey: `${student.id}:${ymd.slice(0, 7)}`,
      });
    }
    return created;
  }

  private async notifyLateStudent(studentId: string, lateCount: number): Promise<number> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        group: { select: { name: true, centerId: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!student) {
      return 0;
    }
    const name = `${student.user.firstName} ${student.user.lastName}`;
    const userIds = await this.recipients.findStaffUserIdsForCenter(student.group?.centerId);
    return this.write.createForUsers({
      userIds,
      type: 'STUDENT_FREQUENT_LATE',
      title: 'Student is frequently late',
      content: `${name} has been late ${lateCount} times in the last 30 days.`,
      data: { studentId, href: `/admin/students/${studentId}` },
      dedupeKey: studentId,
    });
  }

  private async notifyMissingRecording(params: {
    student: { id: string; user: { id: string; email: string; firstName: string } };
    lessonId: string;
    groupId: string;
    teacherUserId: string;
    lessonLabel: string;
    ymd: string;
  }): Promise<number> {
    const { student, lessonId, groupId, teacherUserId, lessonLabel, ymd } = params;
    const href = buildStudentRecordingChatHref(teacherUserId, lessonId);

    const created = await this.write.createForUsers({
      userIds: [student.user.id],
      type: 'STUDENT_RECORDING_MISSING',
      title: 'Recording missing for today’s lesson',
      content: buildStudentRecordingCopy(lessonLabel),
      data: {
        studentId: student.id,
        lessonId,
        groupId,
        teacherId: teacherUserId,
        href,
      },
      dedupeKey: `${lessonId}:${student.id}:${ymd}`,
    });
    if (created > 0) {
      await this.email.sendStudentRecordingReminder(
        student.user.email,
        student.user.firstName,
        lessonLabel,
      );
    }
    return created;
  }
}
