import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@ilona/database';
import {
  evaluateStudentsAtRisk,
  loadAttendanceBreakdownByStudent,
} from '../students/student-at-risk.query';
import { getAtRiskMonthRange } from '../students/student-at-risk.util';
import type { StudentRiskLevel } from './analytics.types';

@Injectable()
export class AnalyticsStudentRiskService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentRiskAnalytics() {
    const asOf = new Date();
    const range = getAtRiskMonthRange(asOf);
    const students = await this.prisma.student.findMany({
      where: { user: { status: UserStatus.ACTIVE } },
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

    const studentIds = students.map((student) => student.id);
    const [evaluations, breakdown] = await Promise.all([
      evaluateStudentsAtRisk(this.prisma, studentIds, { asOf }),
      loadAttendanceBreakdownByStudent(this.prisma, studentIds, range.start, range.end),
    ]);

    const riskAnalytics = students.map((student) => {
      const stats = breakdown.get(student.id) ?? {
        present: 0,
        justified: 0,
        unjustified: 0,
        total: 0,
      };
      const evaluation = evaluations.get(student.id);
      const attendanceRate =
        stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 100;
      const riskLevel: StudentRiskLevel = evaluation?.riskLevel ?? 'LOW';
      const hasLatePayment = evaluation?.hasLatePayment ?? false;

      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        phone: student.user.phone,
        group: student.group,
        totalLessons: stats.total,
        present: stats.present,
        absentJustified: stats.justified,
        absentUnjustified: stats.unjustified,
        attendanceRate,
        riskLevel,
        pendingPayments: hasLatePayment ? 1 : 0,
        hasLatePayment,
        absenceCount: evaluation?.absenceCount ?? 0,
        isAtRisk: evaluation?.isAtRisk ?? false,
      };
    });

    const riskOrder: Record<StudentRiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return riskAnalytics.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
  }
}
