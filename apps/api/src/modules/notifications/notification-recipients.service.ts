import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationRecipientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    return admins.map((user) => user.id);
  }

  async findManagerUserIdsForCenter(centerId: string | null | undefined): Promise<string[]> {
    if (!centerId) {
      return [];
    }
    const managers = await this.prisma.managerProfile.findMany({
      where: {
        centerId,
        isCurrentAssignment: true,
        user: { status: UserStatus.ACTIVE },
      },
      select: { userId: true },
    });
    return managers.map((row) => row.userId);
  }

  async findStaffUserIdsForCenter(centerId: string | null | undefined): Promise<string[]> {
    const [admins, managers] = await Promise.all([
      this.findAdminUserIds(),
      this.findManagerUserIdsForCenter(centerId),
    ]);
    return [...new Set([...admins, ...managers])];
  }

  async findTeacherUserIdsForGroup(groupId: string): Promise<string[]> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        teacher: { select: { userId: true } },
        secondTeacher: { select: { userId: true } },
      },
    });
    if (!group) {
      return [];
    }
    return [group.teacher?.userId, group.secondTeacher?.userId].filter(
      (id): id is string => Boolean(id),
    );
  }

  async findTeacherUserId(teacherId: string): Promise<string | null> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { userId: true },
    });
    return teacher?.userId ?? null;
  }
}
