import { Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationData, NotificationListResponse, PortalNotification } from '@ilona/types';
import { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildStudentRecordingChatHref,
  buildStudentRecordingCopy,
  buildStudentRecordingThankYouCopy,
  formatStudentRecordingLessonLabel,
  resolveStudentRecordingTeacherUserId,
  studentRecordingLessonSelect,
} from './student-recording-notification.util';

const DEFAULT_TAKE = 30;
const MAX_TAKE = 50;

@Injectable()
export class NotificationInboxService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    cursor?: string,
    take = DEFAULT_TAKE,
  ): Promise<NotificationListResponse> {
    const limit = Math.min(Math.max(take, 1), MAX_TAKE);
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = await this.mapRows(page);
    return {
      items,
      unreadCount,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async unreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  async markRead(userId: string, id: string): Promise<{ ok: true }> {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ ok: true }> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  private async mapRows(
    rows: Array<{
      id: string;
      type: string;
      title: string;
      content: string;
      data: Prisma.JsonValue;
      isRead: boolean;
      readAt: Date | null;
      createdAt: Date;
    }>,
  ): Promise<PortalNotification[]> {
    const lessonIds = rows
      .filter((row) => row.type === 'STUDENT_RECORDING_MISSING')
      .map((row) => {
        const data = (row.data ?? null) as NotificationData | null;
        return data?.lessonId;
      })
      .filter((id): id is string => Boolean(id));

    const uniqueLessonIds = [...new Set(lessonIds)];
    const lessons =
      uniqueLessonIds.length > 0
        ? await this.prisma.lesson.findMany({
            where: { id: { in: uniqueLessonIds } },
            select: { id: true, ...studentRecordingLessonSelect },
          })
        : [];
    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

    const studentLessonPairs = rows
      .filter((row) => row.type === 'STUDENT_RECORDING_MISSING')
      .map((row) => {
        const data = (row.data ?? null) as NotificationData | null;
        if (!data?.lessonId || !data.studentId) return null;
        return { lessonId: data.lessonId, studentId: data.studentId };
      })
      .filter((pair): pair is { lessonId: string; studentId: string } => Boolean(pair));

    const completedKeys = new Set<string>();
    if (studentLessonPairs.length > 0) {
      const recordingRows = await this.prisma.recordingItem.findMany({
        where: {
          OR: studentLessonPairs.map((pair) => ({
            lessonId: pair.lessonId,
            studentId: pair.studentId,
          })),
        },
        select: { lessonId: true, studentId: true },
      });
      for (const row of recordingRows) {
        if (row.lessonId) {
          completedKeys.add(`${row.lessonId}:${row.studentId}`);
        }
      }
    }

    return rows.map((row) => {
      const baseData = (row.data ?? null) as NotificationData | null;
      let content = row.content;
      let data = baseData;

      if (row.type === 'STUDENT_RECORDING_MISSING' && baseData?.lessonId) {
        const alreadyDone =
          Boolean(baseData.recordingCompleted) ||
          (baseData.studentId
            ? completedKeys.has(`${baseData.lessonId}:${baseData.studentId}`)
            : false);

        if (alreadyDone) {
          content = buildStudentRecordingThankYouCopy();
          data = {
            ...baseData,
            recordingCompleted: true,
            href: undefined,
          };
        } else {
          const lesson = lessonById.get(baseData.lessonId);
          if (lesson) {
            const teacherUserId =
              baseData.teacherId ?? resolveStudentRecordingTeacherUserId(lesson) ?? undefined;
            const lessonLabel = formatStudentRecordingLessonLabel(lesson);
            if (!content.includes('«')) {
              content = buildStudentRecordingCopy(lessonLabel);
            }
            if (teacherUserId) {
              data = {
                ...baseData,
                teacherId: teacherUserId,
                href: buildStudentRecordingChatHref(teacherUserId, baseData.lessonId),
              };
            }
          }
        }
      }

      return {
        id: row.id,
        type: row.type,
        title: row.title,
        content,
        data,
        isRead: row.isRead,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }
}
