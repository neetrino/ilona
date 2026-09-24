import { Injectable, Logger } from '@nestjs/common';
import { getCalendarDateInTimezone } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationRecipientsService } from './notification-recipients.service';
import { NotificationWriteService } from './notification-write.service';

function readStringIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

@Injectable()
export class NotificationEventsService {
  private readonly logger = new Logger(NotificationEventsService.name);

  constructor(
    private readonly write: NotificationWriteService,
    private readonly recipients: NotificationRecipientsService,
    private readonly prisma: PrismaService,
  ) {}

  async notifyTeachersNewStudent(params: {
    groupId: string;
    studentId: string;
    studentName: string;
    groupName: string;
  }): Promise<void> {
    const userIds = await this.recipients.findTeacherUserIdsForGroup(params.groupId);
    await this.write.createForUsers({
      userIds,
      type: 'NEW_STUDENT_IN_GROUP',
      title: 'New student in your group',
      content: `${params.studentName} was added to ${params.groupName}.`,
      data: {
        studentId: params.studentId,
        groupId: params.groupId,
        href: `/teacher/students/${params.studentId}`,
      },
      dedupeKey: `${params.groupId}:${params.studentId}`,
    });
  }

  async notifySubstituteAssigned(params: {
    substituteTeacherId: string;
    groupName: string;
    lessonId: string;
    scheduledAt: Date;
  }): Promise<void> {
    const userId = await this.recipients.findTeacherUserId(params.substituteTeacherId);
    if (!userId) {
      return;
    }
    const date = getCalendarDateInTimezone(params.scheduledAt);
    await this.write.createForUsers({
      userIds: [userId],
      type: 'SUBSTITUTE_ASSIGNED',
      title: 'You were assigned as substitute',
      content: `You will cover ${params.groupName} on ${date}.`,
      data: {
        lessonId: params.lessonId,
        teacherId: params.substituteTeacherId,
        href: `/teacher/daily-duties/${params.lessonId}`,
      },
      dedupeKey: `${params.lessonId}:${params.substituteTeacherId}`,
    });
  }

  async notifyTeacherMentioned(params: {
    mentionedUserIds: string[];
    chatId: string;
    messageId: string;
    senderName: string;
  }): Promise<void> {
    await this.write.createForUsers({
      userIds: params.mentionedUserIds,
      type: 'GROUP_TEACHER_MENTION',
      title: 'You were mentioned in group chat',
      content: `${params.senderName} tagged you and is waiting for a reply.`,
      data: {
        chatId: params.chatId,
        messageId: params.messageId,
        href: `/teacher/chat?chatId=${params.chatId}`,
      },
      dedupeKey: params.messageId,
    });
  }

  async notifyManagersLevelAlert(params: {
    centerId: string;
    studentId: string;
    studentName: string;
    groupName: string;
  }): Promise<void> {
    const userIds = await this.recipients.findStaffUserIdsForCenter(params.centerId);
    await this.write.createForUsers({
      userIds,
      type: 'STUDENT_LEVEL_ALERT',
      title: 'Student level does not match the group',
      content: `${params.studentName} in ${params.groupName} may need a group change.`,
      data: {
        studentId: params.studentId,
        href: `/admin/students/${params.studentId}`,
      },
      dedupeKey: params.studentId,
    });
  }

  async notifyStudentAbsenceLetter(params: {
    userId: string;
    studentId: string;
    lessonId: string;
  }): Promise<void> {
    await this.write.createForUsers({
      userIds: [params.userId],
      type: 'STUDENT_ABSENCE',
      title: 'We missed you today! 💙',
      content:
        'Սիրելի՛ սովորող, այսօր մեր դասին չներկայացար, և անկեղծորեն շատ ափսոսում ենք, որ բաց թողեցիր այն։ Այսօր քո ընկերները արդեն սկսեցին ավելի վստահ ու ճիշտ խոսել։ Հուսով ենք՝ հաջորդ դասին դու էլ կմիանես մեզ, որպեսզի բաց չթողնես քո անգլերեն սովորելու հնարավորությունը:\nSee you next class! We’ll be waiting for you💙',
      data: {
        studentId: params.studentId,
        lessonId: params.lessonId,
        href: '/student/dashboard',
      },
      dedupeKey: `${params.lessonId}:${params.studentId}`,
    });
  }

  async notifyStudentLessonRecordingCompleted(params: {
    teacherUserId: string;
    centerId: string | null;
    studentId: string;
    studentName: string;
    lessonId: string;
    lessonLabel: string;
  }): Promise<void> {
    const shared = {
      type: 'STUDENT_LESSON_RECORDING_DONE' as const,
      title: 'Student sent lesson recording',
      content: `${params.studentName} completed the voice for «${params.lessonLabel}».`,
      dedupeKey: `${params.lessonId}:${params.studentId}`,
    };
    await this.write.createForUsers({
      ...shared,
      userIds: [params.teacherUserId],
      data: {
        studentId: params.studentId,
        lessonId: params.lessonId,
        teacherId: params.teacherUserId,
        href: '/teacher/recordings',
      },
    });
    const managerIds = await this.recipients.findManagerUserIdsForCenter(params.centerId);
    await this.write.createForUsers({
      ...shared,
      userIds: managerIds,
      data: {
        studentId: params.studentId,
        lessonId: params.lessonId,
        href: '/admin/recording',
      },
    });
  }

  async notifyPaymentConfirmed(params: {
    centerId: string | null;
    paymentId: string;
    studentName: string;
    studentId: string;
  }): Promise<void> {
    const userIds = await this.recipients.findAdminUserIds();
    await this.write.createForUsers({
      userIds,
      type: 'PAYMENT_CONFIRMED',
      title: 'Payment confirmed',
      content: `Payment for ${params.studentName} was marked as paid.`,
      data: {
        paymentId: params.paymentId,
        studentId: params.studentId,
        href: `/admin/students/${params.studentId}`,
      },
      dedupeKey: params.paymentId,
    });
  }

  async notifyMentionsFromMessage(params: {
    metadata?: Record<string, unknown>;
    chatId: string;
    messageId: string;
    senderId: string;
  }): Promise<void> {
    const mentioned = readStringIds(params.metadata?.mentionedUserIds).filter(
      (id) => id !== params.senderId,
    );
    if (mentioned.length === 0) {
      return;
    }
    const sender = await this.prisma.user.findUnique({
      where: { id: params.senderId },
      select: { firstName: true, lastName: true },
    });
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Someone';
    await this.notifyTeacherMentioned({
      mentionedUserIds: mentioned,
      chatId: params.chatId,
      messageId: params.messageId,
      senderName,
    });
  }

  async runSafe(label: string, task: () => Promise<void>): Promise<void> {
    try {
      await task();
    } catch (error) {
      this.logger.error(`Notification event failed: ${label}`, error);
    }
  }
}
