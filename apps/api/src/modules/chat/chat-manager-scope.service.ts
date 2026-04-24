import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatType, UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

/** Minimal chat shape for manager branch checks */
export type ChatScopeShape = {
  id: string;
  type: ChatType;
  groupId: string | null;
  group?: { center?: { id: string } | null } | null;
  participants: { userId: string }[];
};

@Injectable()
export class ChatManagerScopeService {
  constructor(private readonly prisma: PrismaService) {}

  managerCenterIdFromJwt(user: JwtPayload | undefined): string | undefined {
    if (!user || user.role !== UserRole.MANAGER) {
      return undefined;
    }
    return getManagerCenterIdOrThrow(user);
  }

  async isStudentUserInBranch(studentUserId: string, centerId: string): Promise<boolean> {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      select: {
        centerId: true,
        group: { select: { centerId: true } },
      },
    });
    if (!student) {
      return false;
    }
    return student.centerId === centerId || student.group?.centerId === centerId;
  }

  async isTeacherUserInBranch(teacherUserId: string, centerId: string): Promise<boolean> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: {
        centerLinks: { where: { centerId }, select: { id: true }, take: 1 },
        groups: { where: { centerId }, select: { id: true }, take: 1 },
      },
    });
    if (!teacher) {
      return false;
    }
    return teacher.centerLinks.length > 0 || teacher.groups.length > 0;
  }

  /**
   * Whether a user may appear in manager chat pickers / custom groups for this branch.
   * Excludes ADMIN and unrelated roles.
   */
  async isUserInManagerBranch(userId: string, centerId: string): Promise<boolean> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!u) {
      return false;
    }
    if (u.role === UserRole.STUDENT) {
      return this.isStudentUserInBranch(userId, centerId);
    }
    if (u.role === UserRole.TEACHER) {
      return this.isTeacherUserInBranch(userId, centerId);
    }
    if (u.role === UserRole.MANAGER) {
      const mp = await this.prisma.managerProfile.findUnique({
        where: { userId },
        select: { centerId: true },
      });
      return mp?.centerId === centerId;
    }
    return false;
  }

  async isChatInManagerBranch(
    chat: ChatScopeShape,
    managerUserId: string,
    centerId: string,
  ): Promise<boolean> {
    if (chat.type === ChatType.GROUP && chat.groupId) {
      const center = chat.group?.center?.id;
      return center === centerId;
    }
    if (chat.type === ChatType.GROUP && !chat.groupId) {
      const others = chat.participants.filter((p) => p.userId !== managerUserId);
      for (const p of others) {
        if (!(await this.isUserInManagerBranch(p.userId, centerId))) {
          return false;
        }
      }
      return true;
    }
    if (chat.type === ChatType.DIRECT) {
      const other = chat.participants.find((p) => p.userId !== managerUserId);
      if (!other) {
        return false;
      }
      return this.isUserInManagerBranch(other.userId, centerId);
    }
    return false;
  }

  async assertManagerCanAccessChat(
    chat: ChatScopeShape,
    managerUserId: string,
    centerId: string,
  ): Promise<void> {
    const ok = await this.isChatInManagerBranch(chat, managerUserId, centerId);
    if (!ok) {
      throw new ForbiddenException('Chat is outside your branch');
    }
  }

  /**
   * Whether a manager may open/maintain a direct chat with the given user (branch only).
   */
  async canManagerDirectMessageUser(managerUserId: string, otherUserId: string): Promise<boolean> {
    const mp = await this.prisma.managerProfile.findUnique({
      where: { userId: managerUserId },
      select: { centerId: true },
    });
    if (!mp?.centerId) {
      return false;
    }
    return this.isUserInManagerBranch(otherUserId, mp.centerId);
  }
}
