import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SalaryStatus } from '@ilona/database';
import { SalaryCalculationService } from './salary-calculation.service';
import {
  getSalaryRecordDb,
  salaryRecordTeacherInclude,
  teacherListInclude,
} from './salary-record-db.util';
import {
  countSubstitutePayLessons,
  enrichSalaryRecordRow,
  countPayableLessonsForMonth,
} from './salary-record.util';
import type {
  SalaryListParams,
  SalaryRecordCountWhereArg,
  SalaryRecordWhereArg,
  SalaryTeacherListParams,
  TeacherCountWhereArg,
  TeacherWhereArg,
} from './salary-record.types';

@Injectable()
export class SalaryRecordListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationService: SalaryCalculationService,
  ) {}

  private get db() {
    return getSalaryRecordDb(this.prisma);
  }

  async findAll(params?: SalaryListParams) {
    const { skip = 0, take = 50, teacherId, status, dateFrom, dateTo, q, centerId } = params || {};

    const teacherWhere: Prisma.TeacherWhereInput = {};
    if (teacherId) {
      teacherWhere.id = teacherId;
    }
    if (centerId) {
      teacherWhere.centerLinks = { some: { centerId } };
    }

    const searchTerm = typeof q === 'string' ? q.trim() : '';
    teacherWhere.user =
      searchTerm.length > 0
        ? {
            AND: [
              { status: 'ACTIVE' },
              {
                OR: [
                  { firstName: { contains: searchTerm, mode: 'insensitive' } },
                  { lastName: { contains: searchTerm, mode: 'insensitive' } },
                  { email: { contains: searchTerm, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : { status: 'ACTIVE' };

    // Monthly earnings: only teachers created on/before the selected month
    // (e.g. created in July must not appear when viewing June).
    if (dateFrom || dateTo) {
      const monthEnd =
        dateTo ??
        new Date(dateFrom!.getFullYear(), dateFrom!.getMonth() + 1, 0, 23, 59, 59, 999);
      teacherWhere.createdAt = { lte: monthEnd };
    }

    const [teachers, totalTeachers] = await Promise.all([
      this.db.teacher.findMany({
        where: teacherWhere as unknown as TeacherWhereArg,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: teacherListInclude,
      }),
      this.db.teacher.count({ where: teacherWhere as unknown as TeacherCountWhereArg }),
    ]);

    const teacherIds = teachers.map((t) => t.id);
    const salaryWhere: Prisma.SalaryRecordWhereInput = {
      teacherId: { in: teacherIds },
    };

    if (status) {
      salaryWhere.status = status;
    }
    if (dateFrom || dateTo) {
      salaryWhere.month = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    const salaryRecords = await this.db.salaryRecord.findMany({
      where: salaryWhere as unknown as SalaryRecordWhereArg,
      include: salaryRecordTeacherInclude,
      orderBy: { month: 'desc' },
    });

    const salaryMap = new Map<string, (typeof salaryRecords)[0]>();
    salaryRecords.forEach((record) => {
      const existing = salaryMap.get(record.teacherId);
      if (!existing || record.month > existing.month) {
        salaryMap.set(record.teacherId, record);
      }
    });

    const itemsWithComputedSalary = await Promise.all(
      teachers.map(async (teacher) => {
        const salaryRecord = salaryMap.get(teacher.id);

        if (salaryRecord) {
          return enrichSalaryRecordRow(this.db, this.calculationService, salaryRecord);
        }

        if (status === SalaryStatus.PAID) {
          return null;
        }

        const monthDate = dateFrom || new Date();
        const defaultMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const computedSalary = await this.calculationService.calculateMonthlySalaryFromLessons(
          teacher.id,
          defaultMonth,
        );
        const lessonsCount = await countPayableLessonsForMonth(this.db, teacher.id, defaultMonth);
        const substituteCount = await countSubstitutePayLessons(this.db, teacher.id, defaultMonth);

        const teacherWithRate = await this.db.teacher.findUnique({
          where: { id: teacher.id },
          select: { lessonRateAMD: true, hourlyRate: true },
        });

        const lessonRate = teacherWithRate?.lessonRateAMD
          ? Number(teacherWithRate.lessonRateAMD)
          : Number(teacherWithRate?.hourlyRate || 0);
        const grossAmount = lessonsCount * lessonRate;

        return {
          id: `placeholder-${teacher.id}`,
          teacherId: teacher.id,
          month: defaultMonth.getMonth() + 1,
          year: defaultMonth.getFullYear(),
          lessonsCount,
          grossAmount,
          totalDeductions: Math.max(0, grossAmount - computedSalary),
          netAmount: computedSalary,
          status: SalaryStatus.PENDING,
          paidAt: null,
          notes: null,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
          teacher: {
            id: teacher.id,
            user: teacher.user,
          },
          obligationsInfo: null,
          hasSubstituteEarnings: substituteCount > 0,
        };
      }),
    );

    const filteredItems = itemsWithComputedSalary.filter((item) => item !== null);

    return {
      items: filteredItems,
      total: totalTeachers,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(totalTeachers / take),
    };
  }

  async findAllRecordsByTeacher(teacherId: string, params?: SalaryTeacherListParams) {
    const { skip = 0, take = 50, status, dateFrom, dateTo } = params || {};

    const where: Prisma.SalaryRecordWhereInput = { teacherId };
    if (status) {
      where.status = status;
    }
    if (dateFrom && dateTo) {
      const f = dateFrom;
      const t = dateTo;
      const fromMonth = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), 1, 0, 0, 0, 0));
      const toMonth = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1, 0, 0, 0, 0));
      const existingAnd = where.AND;
      const rangeAnd: Prisma.SalaryRecordWhereInput = {
        OR: [
          { status: SalaryStatus.PAID, paidAt: { gte: f, lte: t } },
          {
            status: { in: [SalaryStatus.PENDING, SalaryStatus.PROCESSING] },
            month: { gte: fromMonth, lte: toMonth },
          },
        ],
      };
      where.AND = Array.isArray(existingAnd)
        ? [...existingAnd, rangeAnd]
        : existingAnd
          ? [existingAnd, rangeAnd]
          : [rangeAnd];
    }

    const [salaryRecords, total] = await Promise.all([
      this.db.salaryRecord.findMany({
        where: where as unknown as SalaryRecordWhereArg,
        include: salaryRecordTeacherInclude,
        orderBy: { month: 'desc' },
        skip,
        take,
      }),
      this.db.salaryRecord.count({ where: where as unknown as SalaryRecordCountWhereArg }),
    ]);

    const itemsWithComputedSalary = await Promise.all(
      salaryRecords.map((salaryRecord) =>
        enrichSalaryRecordRow(this.db, this.calculationService, salaryRecord),
      ),
    );

    return {
      items: itemsWithComputedSalary,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }
}
