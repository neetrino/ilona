import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MessageType, UserRole } from '@ilona/database';
import type { AdminStudentRecordingFilters, MessageWithChatForRecordings } from './message.types';
import {
  ADMIN_STUDENT_RECORDING_INCLUDE,
  buildAdminRecordingSenderWhere,
  isVoiceToTeacherAdminRecording,
  mapAdminStudentRecording,
} from './message-recording.admin';
import { applyRecordingPagination } from './message-recording.util';

@Injectable()
export class MessageRecordingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentVoiceToTeacherRecordings(
    studentUserId: string,
    filters?: { year?: number; month?: number; day?: number },
  ) {
    const baseWhere: Prisma.MessageWhereInput = {
      senderId: studentUserId,
      type: MessageType.VOICE,
      fileUrl: { not: null },
    };

    if (filters?.year != null && !Number.isNaN(filters.year)) {
      const y = filters.year;
      if (
        filters.month != null &&
        !Number.isNaN(filters.month) &&
        filters.day != null &&
        !Number.isNaN(filters.day)
      ) {
        const start = new Date(Date.UTC(y, filters.month - 1, filters.day, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y, filters.month - 1, filters.day + 1, 0, 0, 0, 0));
        baseWhere.createdAt = { gte: start, lt: end };
      } else if (filters.month != null && !Number.isNaN(filters.month)) {
        const start = new Date(Date.UTC(y, filters.month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y, filters.month, 1, 0, 0, 0, 0));
        baseWhere.createdAt = { gte: start, lt: end };
      } else {
        const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0, 0));
        baseWhere.createdAt = { gte: start, lt: end };
      }
    }

    const messages = await this.prisma.message.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        chat: {
          include: {
            participants: {
              where: { userId: { not: studentUserId } },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const voiceToTeacherOnly = messages.filter((m: MessageWithChatForRecordings) => {
      const meta = m.metadata as Record<string, unknown> | null;
      return meta && meta.voiceToTeacher === true;
    });

    return voiceToTeacherOnly.map((m: MessageWithChatForRecordings) => {
      const teacherParticipant = m.chat.participants[0];
      return {
        id: m.id,
        fileUrl: m.fileUrl,
        fileName: m.fileName ?? undefined,
        duration: m.duration ?? 0,
        createdAt: m.createdAt,
        teacher: teacherParticipant?.user
          ? {
              id: teacherParticipant.user.id,
              firstName: teacherParticipant.user.firstName,
              lastName: teacherParticipant.user.lastName,
            }
          : null,
      };
    });
  }

  async getAdminStudentRecordings(
    _adminUserId: string,
    filters?: AdminStudentRecordingFilters,
    branchCenterId?: string,
  ) {
    const effectiveFilters = filters ?? {};
    const messages = await this.prisma.message.findMany({
      where: {
        type: MessageType.VOICE,
        fileUrl: { not: null },
        sender: buildAdminRecordingSenderWhere(effectiveFilters, branchCenterId),
      },
      orderBy: { createdAt: 'desc' },
      include: ADMIN_STUDENT_RECORDING_INCLUDE,
    });

    const normalizedSearch = effectiveFilters.search?.trim().toLowerCase();
    const mapped = messages
      .filter((message) =>
        isVoiceToTeacherAdminRecording(message, effectiveFilters, normalizedSearch),
      )
      .map(mapAdminStudentRecording);

    return applyRecordingPagination(mapped, {
      skip: effectiveFilters.skip,
      take: effectiveFilters.take,
    });
  }

  async getTeacherStudentRecordings(
    teacherUserId: string,
    filters?: AdminStudentRecordingFilters,
  ) {
    const messages = await this.prisma.message.findMany({
      where: {
        type: MessageType.VOICE,
        fileUrl: { not: null },
        ...(filters?.studentUserId ? { senderId: filters.studentUserId } : {}),
        sender: {
          role: UserRole.STUDENT,
          student: {
            ...(filters?.groupId ? { groupId: filters.groupId } : {}),
            OR: [
              { group: { teacher: { userId: teacherUserId } } },
              { teacher: { userId: teacherUserId } },
            ],
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            student: {
              select: {
                id: true,
                group: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const normalizedSearch = filters?.search?.trim().toLowerCase();

    return messages
      .filter((message) => {
        const meta = message.metadata as Record<string, unknown> | null;
        if (!meta || meta.voiceToTeacher !== true) return false;

        if (normalizedSearch) {
          const fullName = `${message.sender?.firstName ?? ''} ${message.sender?.lastName ?? ''}`
            .trim()
            .toLowerCase();
          if (!fullName.includes(normalizedSearch)) return false;
        }

        return true;
      })
      .map((message) => ({
        id: message.id,
        fileUrl: message.fileUrl as string,
        fileName: message.fileName ?? undefined,
        duration: message.duration ?? 0,
        createdAt: message.createdAt,
        student: {
          userId: message.sender?.id ?? '',
          firstName: message.sender?.firstName ?? '',
          lastName: message.sender?.lastName ?? '',
        },
        group: {
          id: message.sender?.student?.group?.id ?? null,
          name: message.sender?.student?.group?.name ?? 'Ungrouped',
        },
      }));
  }
}
