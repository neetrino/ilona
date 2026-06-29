import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LessonStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { SalariesService } from './salaries.service';

@Injectable()
export class FinanceControllerScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salariesService: SalariesService,
  ) {}

  async ensureTeacherSalaryRecords(teacherId: string): Promise<void> {
    const [lessons, deductions] = await Promise.all([
      this.prisma.lesson.findMany({
        where: {
          teacherId,
          status: { not: LessonStatus.CANCELLED },
        },
        select: { scheduledAt: true },
        orderBy: { scheduledAt: 'desc' },
        take: 500,
      }),
      this.prisma.deduction.findMany({
        where: { teacherId },
        select: { appliedAt: true },
        orderBy: { appliedAt: 'desc' },
        take: 500,
      }),
    ]);

    const monthKeys = new Set<string>();
    lessons.forEach((lesson) => {
      const d = lesson.scheduledAt;
      monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    deductions.forEach((deduction) => {
      const d = deduction.appliedAt;
      monthKeys.add(`${d.getFullYear()}-${d.getMonth()}`);
    });

    await Promise.all(
      Array.from(monthKeys).map((key) => {
        const [yearStr, monthStr] = key.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        return this.salariesService.generateSalaryRecord(
          teacherId,
          new Date(year, month, 1),
        );
      }),
    );
  }

  async getCurrentStudentOrThrow(user: JwtPayload): Promise<{ id: string }> {
    const student = await this.prisma.student.findUnique({
      where: { userId: user.sub },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return student;
  }

  async assertManagerCanReadTeacher(user: JwtPayload, teacherId: string): Promise<void> {
    const managerCenterId = getManagerCenterIdOrThrow(user);
    if (!managerCenterId) {
      return;
    }
    const link = await this.prisma.teacherCenter.findFirst({
      where: { teacherId, centerId: managerCenterId },
      select: { teacherId: true },
    });
    if (link) return;
    const fallback = await this.prisma.group.findFirst({
      where: { teacherId, centerId: managerCenterId },
      select: { id: true },
    });
    if (!fallback) {
      throw new ForbiddenException('You do not have access to this teacher');
    }
  }
}
