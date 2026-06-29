import type { PrismaClient } from '@ilona/database';
import type { PrismaService } from '../prisma/prisma.service';

export interface ParticipantUserId {
  userId: string;
}

export interface ChatWithParticipantIds {
  id: string;
  participants: ParticipantUserId[];
}

export function getChatDb(prisma: PrismaService): PrismaClient {
  return prisma as unknown as PrismaClient;
}

export const CHAT_GROUP_INCLUDE = {
  group: {
    select: {
      id: true,
      name: true,
      level: true,
      center: { select: { id: true, name: true } },
      teacherId: true,
      teacher: { select: { userId: true } },
    },
  },
  participants: {
    where: { leftAt: null },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  },
} as const;

export const CHAT_DETAIL_GROUP_INCLUDE = {
  group: {
    select: {
      id: true,
      name: true,
      level: true,
      center: { select: { id: true, name: true } },
      teacherId: true,
      teacher: { select: { userId: true } },
    },
  },
  participants: {
    where: { leftAt: null },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          status: true,
        },
      },
    },
  },
} as const;
