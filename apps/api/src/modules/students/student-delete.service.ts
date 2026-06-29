import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { StudentManagerAccessService } from './student-manager-access.service';
import { StudentReadService } from './student-read.service';

@Injectable()
export class StudentDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly managerAccess: StudentManagerAccessService,
    private readonly readService: StudentReadService,
  ) {}
  async delete(id: string, user?: JwtPayload) {
    await this.managerAccess.assertManagerStudentAccess(id, user?.sub, user?.role);
    const student = await this.readService.findById(id, user?.sub, user?.role);

    // Delete user (cascades to student)
    await this.prisma.user.delete({
      where: { id: student.user.id },
    });

    return { success: true };
  }

  /**
   * Delete multiple students by id in a single transaction. Only ADMIN can call this.
   */
  async deleteMany(ids: string[], user?: JwtPayload) {
    if (!ids || ids.length === 0) {
      return { success: true, deleted: 0 };
    }
    const uniqueIds = [...new Set(ids)];
    if (user?.role === UserRole.MANAGER) {
      const managerCenterId = getManagerCenterIdOrThrow(user);
      if (managerCenterId) {
        const scopedStudents = await this.prisma.student.findMany({
          where: {
            id: { in: uniqueIds },
            OR: [{ group: { centerId: managerCenterId } }, { centerId: managerCenterId }],
          },
          select: { id: true, userId: true },
        });

        if (scopedStudents.length !== uniqueIds.length) {
          throw new ForbiddenException('One or more students are outside your assigned center');
        }

        const scopedUserIds = scopedStudents.map((s) => s.userId);
        await this.prisma.$transaction([
          this.prisma.student.deleteMany({ where: { id: { in: scopedStudents.map((s) => s.id) } } }),
          this.prisma.user.deleteMany({ where: { id: { in: scopedUserIds } } }),
        ]);
        return { success: true, deleted: scopedStudents.length };
      }
    }

    const students = await this.prisma.student.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, userId: true },
    });
    const userIds = students.map((s) => s.userId);
    if (userIds.length === 0) {
      return { success: true, deleted: 0 };
    }
    await this.prisma.$transaction([
      this.prisma.student.deleteMany({ where: { id: { in: students.map((s) => s.id) } } }),
      this.prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);
    return { success: true, deleted: students.length };
  }
}
