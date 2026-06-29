import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LessonStatus } from '@ilona/database';
import { lessonsPayableToTeacherWhere } from '../../common/lesson-instructor';
import { getSalaryRecordDb, salaryRecordDetailTeacherInclude } from './salary-record-db.util';
import {
  buildPaidActionBreakdown,
  getMonthBounds,
  parseObligationsInfo,
} from './salary-record.util';
import { lessonDutyPaymentSelect, toLessonDutyTimestamps } from './lesson-duty-payment.util';
import { buildPaymentEligibleActions } from '@ilona/types';

@Injectable()
export class SalaryRecordReadService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return getSalaryRecordDb(this.prisma);
  }

  async findById(id: string) {
    const record = await this.db.salaryRecord.findUnique({
      where: { id },
      include: salaryRecordDetailTeacherInclude,
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

    const { startOfMonth, endOfMonth } = getMonthBounds(new Date(record.month));
    const lessons = await this.db.lesson.findMany({
      where: {
        ...lessonsPayableToTeacherWhere(record.teacherId),
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          not: LessonStatus.CANCELLED,
        },
      },
      select: lessonDutyPaymentSelect,
    });

    const actionBreakdown = buildPaidActionBreakdown(
      lessons.map((lesson) => buildPaymentEligibleActions(toLessonDutyTimestamps(lesson))),
    );

    return {
      ...record,
      obligationsInfo: parseObligationsInfo(record.notes),
      actionBreakdown,
    };
  }
}
