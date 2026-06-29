import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

@Injectable()
export class TeacherAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertManagerTeacherAccess(teacherId: string, currentUser?: JwtPayload) {
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);
    if (!managerCenterId) return;

    const teacherInCenter = await this.prisma.teacher.findFirst({
      where: {
        id: teacherId,
        OR: [
          { groups: { some: { centerId: managerCenterId } } },
          { centerLinks: { some: { centerId: managerCenterId } } },
        ],
      },
      select: { id: true },
    });

    if (!teacherInCenter) {
      throw new ForbiddenException('You do not have access to this teacher');
    }
  }
}
