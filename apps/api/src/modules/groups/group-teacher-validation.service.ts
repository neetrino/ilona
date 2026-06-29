import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupTeacherValidationService {
  constructor(private readonly prisma: PrismaService) {}

  validateGroupTeachers(params: {
    teacherId?: string | null;
    secondTeacherId?: string | null;
    requireBoth?: boolean;
  }) {
    const teacherId = params.teacherId ?? null;
    const secondTeacherId = params.secondTeacherId ?? null;

    if (params.requireBoth) {
      if (!teacherId || !secondTeacherId) {
        throw new BadRequestException('Assign both teachers to the group.');
      }
    }

    if (teacherId && secondTeacherId && teacherId === secondTeacherId) {
      throw new BadRequestException('The two group teachers must be different people.');
    }
  }

  async assertTeachersExist(teacherIds: string[]) {
    for (const id of teacherIds) {
      const teacher = await this.prisma.teacher.findUnique({ where: { id } });
      if (!teacher) {
        throw new BadRequestException(`Teacher with ID ${id} not found`);
      }
    }
  }

  async assertTeachersBelongToCenter(centerId: string, teacherIds: string[]) {
    for (const teacherId of teacherIds) {
      const hasCenterLink = await this.prisma.teacherCenter.findFirst({
        where: { teacherId, centerId },
      });
      if (hasCenterLink) continue;

      const teachesGroupAtCenter = await this.prisma.group.findFirst({
        where: { centerId, teacherId },
      });
      if (teachesGroupAtCenter) continue;

      throw new BadRequestException(
        `Teacher with ID ${teacherId} is not assigned to the selected center`,
      );
    }
  }
}
