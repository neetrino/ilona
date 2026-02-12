import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SalaryStatus, LessonStatus } from '@prisma/client';
import { CreateSalaryRecordDto, ProcessSalaryDto } from './dto/create-salary-record.dto';

@Injectable()
export class SalariesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all salary records
   */
  async findAll(params?: {
    skip?: number;
    take?: number;
    teacherId?: string;
    status?: SalaryStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { skip = 0, take = 50, teacherId, status, dateFrom, dateTo } = params || {};

    const where: Prisma.SalaryRecordWhereInput = {};

    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.month = {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.salaryRecord.findMany({
        where,
        skip,
        take,
        orderBy: { month: 'desc' },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.salaryRecord.count({ where }),
    ]);

    // Parse obligations info from notes for each item
    const itemsWithObligations = items.map((item) => {
      let obligationsInfo = null;
      if (item.notes) {
        try {
          obligationsInfo = JSON.parse(item.notes);
        } catch {
          // If parsing fails, ignore
        }
      }
      return {
        ...item,
        obligationsInfo,
      };
    });

    return {
      items: itemsWithObligations,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Get salary record by ID
   */
  async findById(id: string) {
    const record = await this.prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Create a salary record manually
   */
  async create(dto: CreateSalaryRecordDto) {
    // Validate teacher
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
    }

    const totalDeductions = dto.totalDeductions || 0;
    const netAmount = dto.grossAmount - totalDeductions;

    return this.prisma.salaryRecord.create({
      data: {
        teacherId: dto.teacherId,
        month: new Date(dto.month),
        lessonsCount: dto.lessonsCount,
        grossAmount: dto.grossAmount,
        totalDeductions,
        netAmount: Math.max(0, netAmount),
        status: SalaryStatus.PENDING,
        notes: dto.notes,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Generate salary record for a teacher for a month
   */
  async generateSalaryRecord(teacherId: string, month: Date) {
    // Get teacher with hourly rate
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${teacherId} not found`);
    }

    // Get start and end of month
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    // Get completed lessons with obligation status
    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId,
        status: LessonStatus.COMPLETED,
        completedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: { 
        duration: true,
        feedbacksCompleted: true,
        absenceMarked: true,
        voiceSent: true,
        textSent: true,
      } as any, // Type assertion needed until Prisma Client is regenerated
    });

    const lessonsCount = lessons.length;
    const totalHours = lessons.reduce((sum, l: any) => sum + (l.duration || 0) / 60, 0);
    const baseSalary = totalHours * Number(teacher.hourlyRate);

    // Calculate obligations completion
    // 4 obligations = 40% of base salary (10% each)
    // If any obligation is missing, deduct 10% of base salary per missing obligation
    let totalObligationsCompleted = 0;
    let totalObligationsRequired = 0;
    let missingObligationsCount = 0;

    lessons.forEach((lesson: any) => {
      // Use optional chaining and defaults in case fields don't exist yet (before migration)
      const obligations = [
        lesson.absenceMarked ?? false,
        lesson.feedbacksCompleted ?? false,
        lesson.voiceSent ?? false,
        lesson.textSent ?? false,
      ];
      
      totalObligationsRequired += 4;
      const completed = obligations.filter(Boolean).length;
      totalObligationsCompleted += completed;
      missingObligationsCount += (4 - completed);
    });

    // Calculate obligations portion: 40% of base salary if all completed
    // Each missing obligation deducts 10% of base salary
    const obligationsCompletionRate = totalObligationsRequired > 0 
      ? totalObligationsCompleted / totalObligationsRequired 
      : 0;
    const obligationsBonus = baseSalary * 0.4 * obligationsCompletionRate;
    
    // Deduction for missing obligations: 10% of base salary per missing obligation
    const obligationDeduction = (missingObligationsCount / totalObligationsRequired) * baseSalary * 0.4;
    
    // Gross amount = base salary + obligations bonus - obligation deductions
    // Simplified: base salary * (1 + 0.4 * completion_rate - 0.4 * missing_rate)
    const grossAmount = baseSalary + obligationsBonus - obligationDeduction;

    // Get other deductions for this period (from Deduction table)
    const otherDeductions = await this.prisma.deduction.aggregate({
      where: {
        teacherId,
        appliedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    });

    const totalOtherDeductions = Number(otherDeductions._sum.amount) || 0;
    const totalDeductions = obligationDeduction + totalOtherDeductions;
    const netAmount = grossAmount - totalOtherDeductions;

    // Check if record already exists for this month
    const existing = await this.prisma.salaryRecord.findFirst({
      where: {
        teacherId,
        month: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Salary record already exists for this month');
    }

    // Store obligations info in notes as JSON
    const obligationsInfo = {
      completed: totalObligationsCompleted,
      required: totalObligationsRequired,
      missing: missingObligationsCount,
      completionRate: obligationsCompletionRate,
    };

    return this.prisma.salaryRecord.create({
      data: {
        teacherId,
        month: startOfMonth,
        lessonsCount,
        grossAmount,
        totalDeductions,
        netAmount: Math.max(0, netAmount),
        status: SalaryStatus.PENDING,
        notes: JSON.stringify(obligationsInfo),
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Process salary payment
   */
  async processSalary(id: string, dto: ProcessSalaryDto) {
    const record = await this.findById(id);

    if (record.status === SalaryStatus.PAID) {
      throw new BadRequestException('Salary is already paid');
    }

    return this.prisma.salaryRecord.update({
      where: { id },
      data: {
        status: SalaryStatus.PAID,
        paidAt: new Date(),
        notes: dto.notes || record.notes,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get teacher salary summary
   */
  async getTeacherSalarySummary(teacherId: string) {
    const [total, paid, pending] = await Promise.all([
      this.prisma.salaryRecord.aggregate({
        where: { teacherId },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.salaryRecord.aggregate({
        where: { teacherId, status: SalaryStatus.PAID },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.salaryRecord.aggregate({
        where: { teacherId, status: SalaryStatus.PENDING },
        _sum: { netAmount: true },
        _count: true,
      }),
    ]);

    // Get total deductions
    const deductions = await this.prisma.deduction.aggregate({
      where: { teacherId },
      _sum: { amount: true },
      _count: true,
    });

    return {
      total: {
        count: total._count,
        amount: Number(total._sum.netAmount) || 0,
      },
      paid: {
        count: paid._count,
        amount: Number(paid._sum.netAmount) || 0,
      },
      pending: {
        count: pending._count,
        amount: Number(pending._sum.netAmount) || 0,
      },
      deductions: {
        count: deductions._count,
        amount: Number(deductions._sum.amount) || 0,
      },
    };
  }

  /**
   * Generate monthly salary records for all teachers
   */
  async generateMonthlySalaries(year: number, month: number) {
    const targetMonth = new Date(year, month - 1, 1);

    // Get all active teachers
    const teachers = await this.prisma.teacher.findMany({
      where: {
        user: { status: 'ACTIVE' },
      },
    });

    const records = [];
    const errors = [];

    for (const teacher of teachers) {
      try {
        const record = await this.generateSalaryRecord(teacher.id, targetMonth);
        records.push(record);
      } catch (error) {
        errors.push({
          teacherId: teacher.id,
          error: (error as Error).message,
        });
      }
    }

    return {
      generated: records.length,
      errors: errors.length,
      records,
      errorDetails: errors,
    };
  }
}
