import { Prisma, UserRole } from '@ilona/database';
import type { AdminStudentRecordingFilters } from './message.types';
import {
  adminRecordingMatchesFilters,
  resolveAdminRecordingGroupIds,
  resolveAdminRecordingStudentIds,
} from './message-recording.util';

export const ADMIN_STUDENT_RECORDING_INCLUDE = {
  sender: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      student: {
        select: {
          id: true,
          center: {
            select: { id: true, name: true },
          },
          group: {
            select: {
              id: true,
              name: true,
              center: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  },
  chat: {
    select: {
      participants: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MessageInclude;

export type AdminRecordingMessage = Prisma.MessageGetPayload<{
  include: typeof ADMIN_STUDENT_RECORDING_INCLUDE;
}>;

export function buildAdminRecordingSenderWhere(
  filters: AdminStudentRecordingFilters,
  branchCenterId?: string,
): Prisma.UserWhereInput {
  const studentIds = resolveAdminRecordingStudentIds(filters);
  const groupIds = resolveAdminRecordingGroupIds(filters);
  const concreteGroupIds = groupIds.filter((id) => id !== 'ungrouped');
  const includeUngrouped = groupIds.includes('ungrouped');
  const hasStudentFilter = studentIds.length > 0;
  const hasGroupFilter = concreteGroupIds.length > 0 || includeUngrouped;

  const groupScope = ((): Prisma.StudentWhereInput | undefined => {
    if (!hasGroupFilter) return undefined;
    const groupOr: Prisma.StudentWhereInput[] = [];
    if (concreteGroupIds.length > 0) {
      groupOr.push({ groupId: { in: concreteGroupIds } });
    }
    if (includeUngrouped) {
      groupOr.push({ groupId: null });
    }
    return groupOr.length === 1 ? groupOr[0] : { OR: groupOr };
  })();

  const branchScope: Prisma.StudentWhereInput | undefined = branchCenterId
    ? {
        OR: [{ group: { centerId: branchCenterId } }, { centerId: branchCenterId }],
      }
    : undefined;

  if (hasStudentFilter && hasGroupFilter && groupScope) {
    const filterOr: Prisma.UserWhereInput = {
      OR: [{ id: { in: studentIds } }, { student: groupScope }],
    };
    return branchScope
      ? { role: UserRole.STUDENT, AND: [filterOr, { student: branchScope }] }
      : { role: UserRole.STUDENT, ...filterOr };
  }

  if (hasStudentFilter) {
    return {
      role: UserRole.STUDENT,
      id: { in: studentIds },
      ...(branchScope ? { student: branchScope } : {}),
    };
  }

  if (hasGroupFilter) {
    const studentAnd: Prisma.StudentWhereInput[] = [];
    if (groupScope) studentAnd.push(groupScope);
    if (branchScope) studentAnd.push(branchScope);
    return {
      role: UserRole.STUDENT,
      student:
        studentAnd.length === 0
          ? undefined
          : studentAnd.length === 1
            ? studentAnd[0]
            : { AND: studentAnd },
    };
  }

  if (branchScope) {
    return { role: UserRole.STUDENT, student: branchScope };
  }

  return { role: UserRole.STUDENT };
}

export function isVoiceToTeacherAdminRecording(
  message: AdminRecordingMessage,
  filters: AdminStudentRecordingFilters,
  normalizedSearch?: string,
): boolean {
  const meta = message.metadata as Record<string, unknown> | null;
  if (!meta || meta.voiceToTeacher !== true) return false;

  const groupId = message.sender?.student?.group?.id ?? null;
  const senderId = message.senderId ?? '';
  if (!adminRecordingMatchesFilters(senderId, groupId, filters)) return false;

  if (normalizedSearch) {
    const fullName = `${message.sender?.firstName ?? ''} ${message.sender?.lastName ?? ''}`
      .trim()
      .toLowerCase();
    if (!fullName.includes(normalizedSearch)) return false;
  }

  return true;
}

export function mapAdminStudentRecording(message: AdminRecordingMessage) {
  const senderId = message.senderId ?? '';
  const teacherParticipant =
    message.chat.participants.find(
      (p) => p.userId !== senderId && p.user.role === UserRole.TEACHER,
    ) ?? message.chat.participants.find((p) => p.userId !== senderId);

  const groupCenter = message.sender?.student?.group?.center ?? null;
  const studentCenter = message.sender?.student?.center ?? null;
  const center = groupCenter ?? studentCenter;

  return {
    id: message.id,
    fileUrl: message.fileUrl as string,
    fileName: message.fileName ?? undefined,
    duration: message.duration ?? 0,
    createdAt: message.createdAt,
    source: 'voiceToTeacher' as const,
    student: {
      userId: message.sender?.id ?? '',
      firstName: message.sender?.firstName ?? '',
      lastName: message.sender?.lastName ?? '',
    },
    group: {
      id: message.sender?.student?.group?.id ?? null,
      name: message.sender?.student?.group?.name ?? 'Ungrouped',
    },
    teacher: teacherParticipant?.user
      ? {
          id: teacherParticipant.user.id,
          firstName: teacherParticipant.user.firstName,
          lastName: teacherParticipant.user.lastName,
        }
      : null,
    center: center
      ? {
          id: center.id,
          name: center.name,
        }
      : null,
  };
}
