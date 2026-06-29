import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentManagerAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertManagerStudentAccess(
    studentId: string,
    currentUserId?: string,
    userRole?: UserRole,
  ): Promise<void> {
    if (userRole !== UserRole.MANAGER || !currentUserId) {
      return;
    }

    const managerProfile = await this.prisma.$queryRaw<Array<{ centerId: string }>>`
      SELECT "centerId" FROM "manager_profiles"
      WHERE "userId" = ${currentUserId} AND "isCurrentAssignment" = true
      LIMIT 1
    `;

    const managerCenterId = managerProfile[0]?.centerId;
    if (!managerCenterId) {
      throw new ForbiddenException('Manager account is not assigned to a center');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        centerId: true,
        group: {
          select: { centerId: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const inManagerCenter =
      student.group?.centerId === managerCenterId || student.centerId === managerCenterId;
    if (!inManagerCenter) {
      throw new ForbiddenException('You do not have access to this student');
    }
  }
}
