import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays } from './analytics.util';
import type { StudentRiskLevel } from './analytics.types';

@Injectable()
export class AnalyticsStudentRiskService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentRiskAnalytics() {
    const students = await this.prisma.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const riskAnalytics = await Promise.all(
      students.map(async (student) => {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const attendances = await this.prisma.attendance.findMany({
          where: {
            studentId: student.id,
            lesson: {
              scheduledAt: { gte: thirtyDaysAgo },
            },
          },
        });

        const totalLessons = attendances.length;
        const present = attendances.filter((a) => a.isPresent).length;
        const absentUnjustified = attendances.filter(
          (a) => !a.isPresent && a.absenceType === 'UNJUSTIFIED',
        ).length;
        const absentJustified = attendances.filter(
          (a) => !a.isPresent && a.absenceType === 'JUSTIFIED',
        ).length;

        const attendanceRate = totalLessons > 0 ? Math.round((present / totalLessons) * 100) : 100;

        let riskLevel: StudentRiskLevel = 'LOW';
        if (absentUnjustified >= 3 || attendanceRate < 60) {
          riskLevel = 'HIGH';
        } else if (absentUnjustified >= 2 || attendanceRate < 80) {
          riskLevel = 'MEDIUM';
        }

        const pendingPayments = await this.prisma.payment.count({
          where: {
            studentId: student.id,
            status: { in: ['PENDING', 'OVERDUE'] },
          },
        });

        return {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
          phone: student.user.phone,
          group: student.group,
          totalLessons,
          present,
          absentJustified,
          absentUnjustified,
          attendanceRate,
          riskLevel,
          pendingPayments,
        };
      }),
    );

    const riskOrder: Record<StudentRiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return riskAnalytics.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
  }
}
