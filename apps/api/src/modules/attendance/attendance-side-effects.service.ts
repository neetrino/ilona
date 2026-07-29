import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';

@Injectable()
export class AttendanceSideEffectsService {
  constructor(private readonly prisma: PrismaService) {}
  async notifyStaffOfPlannedAbsence(
    student: {
      id: string;
      user: { firstName: string; lastName: string };
      group: {
        name: string;
        teacherId: string | null;
        secondTeacherId?: string | null;
        centerId: string;
      } | null;
    },
    dateStr: string,
    comment: string,
  ) {
    const groupName = student.group?.name ?? '—';
    const title = 'Planned student absence';
    const content = `${student.user.firstName} ${student.user.lastName} (${groupName}) will be absent on ${dateStr}. Note: ${comment}`;

    const userIds = new Set<string>();

    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    admins.forEach((a) => userIds.add(a.id));

    const teacherIds = [student.group?.teacherId, student.group?.secondTeacherId].filter(
      (id): id is string => Boolean(id),
    );
    if (teacherIds.length > 0) {
      const teachers = await this.prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { userId: true },
      });
      teachers.forEach((t) => userIds.add(t.userId));
    }

    if (student.group?.centerId) {
      const managers = await this.prisma.managerProfile.findMany({
        where: {
          centerId: student.group.centerId,
          isCurrentAssignment: true,
          user: { status: 'ACTIVE' },
        },
        select: { userId: true },
      });
      managers.forEach((m) => userIds.add(m.userId));
    }

    if (userIds.size === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: [...userIds].map((uid) => ({
        userId: uid,
        type: 'planned_absence',
        title,
        content,
        data: {
          studentId: student.id,
          date: dateStr,
          status: 'planned_absence',
        },
      })),
    });
  }

  async checkAbsenceThreshold(studentId: string) {
    const settings = await this.prisma.systemSettings.findFirst();
    const threshold = settings?.maxUnjustifiedAbsences ?? 3;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const unjustifiedCount = await this.prisma.attendance.count({
      where: {
        studentId,
        isPresent: false,
        absenceType: 'UNJUSTIFIED',
        lesson: {
          scheduledAt: { gte: oneMonthAgo },
        },
      },
    });

    if (unjustifiedCount >= threshold) {
      // Create notification for admin
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          group: { select: { name: true } },
        },
      });

      if (student) {
        // Get all admins
        const admins = await this.prisma.user.findMany({
          where: { role: 'ADMIN' },
        });

        // Create notifications
        await this.prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'absence_warning',
            title: 'Student Absence Alert',
            content: `${student.user.firstName} ${student.user.lastName} (${student.group?.name}) has ${unjustifiedCount} unjustified absences in the last month.`,
            data: {
              studentId,
              unjustifiedCount,
              threshold,
            },
          })),
        });
      }
    }
  }
}
