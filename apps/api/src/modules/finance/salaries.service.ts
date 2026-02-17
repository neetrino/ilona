import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SalaryStatus, LessonStatus } from '@prisma/client';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';

@Injectable()
export class SalariesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalculate and update salary record for a teacher for a specific month
   * This is called automatically when lesson actions are updated
   */
  async recalculateSalaryForMonth(teacherId: string, month: Date): Promise<void> {
    try {
      // Get start of month
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      
      // Check if salary record exists for this month
      const existing = await this.prisma.salaryRecord.findFirst({
        where: {
          teacherId,
          month: startOfMonth,
        },
      });

      if (existing) {
        // Recalculate and update existing record
        await this.generateSalaryRecord(teacherId, month);
      }
      // If no record exists, we don't create one automatically
      // It will be created when explicitly requested via generateSalaryRecord
    } catch (error) {
      // Silently fail to avoid breaking action updates
      // Log error in production
      console.error(`Failed to recalculate salary for teacher ${teacherId}, month ${month}:`, error);
    }
  }

  /**
   * Calculate monthly salary from lessons for a teacher
   * This is the single source of truth for salary calculation
   * Returns: SUM of (baseSalary * completedActions / 4) for all lessons in the month
   * Salary is calculated per lesson (fixed price per class), NOT per hour
   * Salary updates immediately when ANY of the 4 actions is completed, without requiring "Lesson Complete"
   */
  private async calculateMonthlySalaryFromLessons(teacherId: string, month: Date): Promise<number> {
    // Get start and end of month
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    // Get teacher with lesson rate (per lesson, not per hour)
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { lessonRateAMD: true, hourlyRate: true }, // Keep hourlyRate for backward compatibility
    });

    if (!teacher) {
      return 0;
    }

    // Get lesson rate: use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
    const lessonRate = teacher.lessonRateAMD 
      ? Number(teacher.lessonRateAMD) 
      : Number(teacher.hourlyRate); // Fallback for backward compatibility

    // Get ALL lessons for this month (not just completed ones)
    // Filter by scheduledAt to include all lessons scheduled in this month
    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId,
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        // Exclude cancelled lessons
        status: {
          not: LessonStatus.CANCELLED,
        },
      },
      select: {
        id: true,
        absenceMarked: true,
        feedbacksCompleted: true,
        voiceSent: true,
        textSent: true,
      } as any,
    });

    // Get other deductions for this period (from Deduction table)
    const otherDeductions = await this.prisma.deduction.findMany({
      where: {
        teacherId,
        appliedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        amount: true,
        lessonId: true,
      },
    });

    // Create a map of lessonId -> deductions
    const deductionsByLessonId = new Map<string, number>();
    otherDeductions.forEach((deduction) => {
      if (deduction.lessonId) {
        const current = deductionsByLessonId.get(deduction.lessonId) || 0;
        deductionsByLessonId.set(deduction.lessonId, current + Number(deduction.amount));
      }
    });

    // Calculate total salary from all lessons using proportional calculation
    // Base salary is per lesson (fixed price), NOT per hour
    let totalSalary = 0;

    for (const lesson of lessons) {
      // Base salary = lessonRateAMD (fixed price per lesson)
      const baseSalary = lessonRate;

      // Calculate completed actions (4 total)
      const completedActions = [
        lesson.absenceMarked ?? false,
        lesson.feedbacksCompleted ?? false,
        lesson.voiceSent ?? false,
        lesson.textSent ?? false,
      ].filter(Boolean).length;

      // Proportional calculation: earned = baseSalary * (completedActions / 4)
      const earned = baseSalary * (completedActions / 4);

      // Get other deductions for this lesson
      const lessonId = typeof lesson.id === 'string' ? lesson.id : String(lesson.id);
      const otherDeductionForLesson = deductionsByLessonId.get(lessonId) || 0;

      // Total = earned - other deductions
      const lessonTotal = Math.max(0, earned - otherDeductionForLesson);
      totalSalary += lessonTotal;
    }

    return totalSalary;
  }

  /**
   * Get all salary records - teacher-based (includes ALL teachers)
   * Returns one entry per teacher with their most recent salary record, or defaults if none exists
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

    // Start from Teachers table to include ALL teachers
    const teacherWhere: Prisma.TeacherWhereInput = {};
    if (teacherId) {
      teacherWhere.id = teacherId;
    }
    // Filter by user status if needed (only active teachers by default)
    teacherWhere.user = {
      status: 'ACTIVE', // Only show active teachers
    };

    // Get all teachers (with pagination)
    const [teachers, totalTeachers] = await Promise.all([
      this.prisma.teacher.findMany({
        where: teacherWhere,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.teacher.count({ where: teacherWhere }),
    ]);

    const teacherIds = teachers.map(t => t.id);

    // Get most recent salary record for each teacher (or all if date filters are applied)
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

    // Get salary records for these teachers
    const salaryRecords = await this.prisma.salaryRecord.findMany({
      where: salaryWhere,
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
      orderBy: { month: 'desc' },
    });

    // Create a map of teacherId -> most recent salary record
    const salaryMap = new Map<string, typeof salaryRecords[0]>();
    salaryRecords.forEach(record => {
      const existing = salaryMap.get(record.teacherId);
      if (!existing || record.month > existing.month) {
        salaryMap.set(record.teacherId, record);
      }
    });

    // Build response: one entry per teacher
    const itemsWithComputedSalary = await Promise.all(
      teachers.map(async (teacher) => {
        const salaryRecord = salaryMap.get(teacher.id);

        if (salaryRecord) {
          // Teacher has salary record(s) matching the filters
          // Parse obligations info from notes
          let obligationsInfo = null;
          if (salaryRecord.notes) {
            try {
              obligationsInfo = JSON.parse(salaryRecord.notes);
            } catch {
              // If parsing fails, ignore
            }
          }

          // Calculate salary from completed lessons (single source of truth)
          const computedSalary = await this.calculateMonthlySalaryFromLessons(
            salaryRecord.teacherId,
            salaryRecord.month
          );

          return {
            ...salaryRecord,
            // Override netAmount with computed salary from completed lessons
            netAmount: computedSalary,
            obligationsInfo,
          };
        } else {
          // Teacher has no salary records matching the filters
          // If filtering by PAID status, exclude teachers with no records (they can't be PAID)
          if (status === SalaryStatus.PAID) {
            return null;
          }

          // For PENDING status or no status filter, calculate actual salary from lessons
          // Return synthetic salary record with computed salary
          const monthDate = dateFrom || new Date(); // Use dateFrom if provided, otherwise current month
          const defaultMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

          // Calculate actual salary from lessons (even if no record exists yet)
          const computedSalary = await this.calculateMonthlySalaryFromLessons(
            teacher.id,
            defaultMonth
          );

          // Get lessons count for this month
          const startOfMonth = new Date(defaultMonth.getFullYear(), defaultMonth.getMonth(), 1);
          const endOfMonth = new Date(defaultMonth.getFullYear(), defaultMonth.getMonth() + 1, 0, 23, 59, 59);
          
          const lessonsCount = await this.prisma.lesson.count({
            where: {
              teacherId: teacher.id,
              scheduledAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
              status: {
                not: LessonStatus.CANCELLED,
              },
            },
          });

          // Get teacher's lesson rate for grossAmount calculation
          const teacherWithRate = await this.prisma.teacher.findUnique({
            where: { id: teacher.id },
            select: { lessonRateAMD: true, hourlyRate: true },
          });

          const lessonRate = teacherWithRate?.lessonRateAMD 
            ? Number(teacherWithRate.lessonRateAMD) 
            : Number(teacherWithRate?.hourlyRate || 0);

          const grossAmount = lessonsCount * lessonRate;

          return {
            id: `placeholder-${teacher.id}`, // Synthetic ID
            teacherId: teacher.id,
            month: defaultMonth,
            lessonsCount,
            grossAmount,
            totalDeductions: Math.max(0, grossAmount - computedSalary),
            netAmount: computedSalary, // Use computed salary, not 0
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
          };
        }
      })
    );

    // Filter out null entries (teachers excluded by status filter)
    const filteredItems = itemsWithComputedSalary.filter(item => item !== null) as typeof itemsWithComputedSalary;

    return {
      items: filteredItems,
      total: totalTeachers,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(totalTeachers / take),
    };
  }

  /**
   * Get salary record by ID with action breakdown
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

    // Get start and end of month
    const monthDate = new Date(record.month);
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    // Get ALL lessons for this month (not just completed ones) for action breakdown
    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId: record.teacherId,
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        // Exclude cancelled lessons
        status: {
          not: LessonStatus.CANCELLED,
        },
      },
      select: {
        absenceMarked: true,
        feedbacksCompleted: true,
        voiceSent: true,
        textSent: true,
      } as any,
    });

    // Calculate action breakdown
    const actionBreakdown = {
      absenceMarked: {
        completed: lessons.filter((l: any) => l.absenceMarked ?? false).length,
        required: lessons.length,
      },
      feedbacksCompleted: {
        completed: lessons.filter((l: any) => l.feedbacksCompleted ?? false).length,
        required: lessons.length,
      },
      voiceSent: {
        completed: lessons.filter((l: any) => l.voiceSent ?? false).length,
        required: lessons.length,
      },
      textSent: {
        completed: lessons.filter((l: any) => l.textSent ?? false).length,
        required: lessons.length,
      },
    };

    // Parse obligations info from notes
    let obligationsInfo = null;
    if (record.notes) {
      try {
        obligationsInfo = JSON.parse(record.notes);
      } catch {
        // If parsing fails, ignore
      }
    }

    return {
      ...record,
      obligationsInfo,
      actionBreakdown,
    };
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
   * Uses the same per-lesson calculation as calculateMonthlySalaryFromLessons for consistency
   * Salary is calculated per lesson (fixed price per class), NOT per hour
   */
  async generateSalaryRecord(teacherId: string, month: Date) {
    // Get teacher with lesson rate (per lesson, not per hour)
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

    // Get lesson rate: use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
    const lessonRate = teacher.lessonRateAMD 
      ? Number(teacher.lessonRateAMD) 
      : Number(teacher.hourlyRate); // Fallback for backward compatibility

    // Get start and end of month
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

    // Get ALL lessons for this month (not just completed ones)
    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId,
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        // Exclude cancelled lessons
        status: {
          not: LessonStatus.CANCELLED,
        },
      },
      select: { 
        id: true,
        feedbacksCompleted: true,
        absenceMarked: true,
        voiceSent: true,
        textSent: true,
      } as any, // Type assertion needed until Prisma Client is regenerated
    });

    const lessonsCount = lessons.length;

    // Get other deductions for this period (from Deduction table)
    const otherDeductions = await this.prisma.deduction.findMany({
      where: {
        teacherId,
        appliedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        amount: true,
        lessonId: true,
      },
    });

    // Create a map of lessonId -> deductions
    const deductionsByLessonId = new Map<string, number>();
    otherDeductions.forEach((deduction) => {
      if (deduction.lessonId) {
        const current = deductionsByLessonId.get(deduction.lessonId) || 0;
        deductionsByLessonId.set(deduction.lessonId, current + Number(deduction.amount));
      }
    });

    // Calculate using the same per-lesson method as calculateMonthlySalaryFromLessons
    // This ensures idempotency and consistency
    // Base salary is per lesson (fixed price), NOT per hour
    // Use proportional calculation: earned = baseSalary * (completedActions / 4)
    let totalBaseSalary = 0;
    let totalEarned = 0;
    let totalOtherDeduction = 0;
    let totalObligationsCompleted = 0;
    let totalObligationsRequired = 0;

    for (const lesson of lessons) {
      // Base salary = lessonRateAMD (fixed price per lesson)
      const baseSalary = lessonRate;
      totalBaseSalary += baseSalary;

      // Calculate completed actions (4 total)
      const completedActions = [
        lesson.absenceMarked ?? false,
        lesson.feedbacksCompleted ?? false,
        lesson.voiceSent ?? false,
        lesson.textSent ?? false,
      ].filter(Boolean).length;
      
      const totalActions = 4;
      totalObligationsRequired += totalActions;
      totalObligationsCompleted += completedActions;

      // Proportional calculation: earned = baseSalary * (completedActions / 4)
      const earned = baseSalary * (completedActions / totalActions);
      totalEarned += earned;

      // Get other deductions for this lesson
      const lessonId = typeof lesson.id === 'string' ? lesson.id : String(lesson.id);
      const otherDeductionForLesson = deductionsByLessonId.get(lessonId) || 0;
      totalOtherDeduction += otherDeductionForLesson;
    }

    // Calculate totals using proportional calculation
    const grossAmount = totalBaseSalary; // Base salary is the gross (before deductions)
    const totalDeductions = totalOtherDeduction; // Only other deductions, no obligation-based deductions
    const netAmount = Math.max(0, totalEarned - totalDeductions);

    // Check if record already exists for this month
    // Use exact month match to leverage the unique constraint [teacherId, month]
    const existing = await this.prisma.salaryRecord.findFirst({
      where: {
        teacherId,
        month: startOfMonth,
      },
    });

    if (existing) {
      // Update existing record instead of throwing error to allow recalculation
      const obligationsInfo = {
        completed: totalObligationsCompleted,
        required: totalObligationsRequired,
        missing: totalObligationsRequired - totalObligationsCompleted,
        completionRate: totalObligationsRequired > 0 
          ? totalObligationsCompleted / totalObligationsRequired 
          : 0,
      };

      return this.prisma.salaryRecord.update({
        where: { id: existing.id },
        data: {
          lessonsCount,
          grossAmount,
          totalDeductions,
          netAmount,
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

    // Store obligations info in notes as JSON
    const obligationsInfo = {
      completed: totalObligationsCompleted,
      required: totalObligationsRequired,
      missing: totalObligationsRequired - totalObligationsCompleted,
      completionRate: totalObligationsRequired > 0 
        ? totalObligationsCompleted / totalObligationsRequired 
        : 0,
    };

    return this.prisma.salaryRecord.create({
      data: {
        teacherId,
        month: startOfMonth,
        lessonsCount,
        grossAmount,
        totalDeductions,
        netAmount,
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
    const record = await this.prisma.salaryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

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
   * Update salary record
   */
  async update(id: string, dto: UpdateSalaryDto) {
    const record = await this.prisma.salaryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

    const updateData: any = {};
    
    if (dto.status !== undefined) {
      // Validate that only PENDING or PAID are allowed (not PROCESSING)
      const validStatuses: SalaryStatus[] = [SalaryStatus.PENDING, SalaryStatus.PAID];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException(`Invalid status: ${dto.status}. Only PENDING and PAID are allowed.`);
      }
      updateData.status = dto.status;
      
      // If setting to PAID, set paidAt
      if (dto.status === SalaryStatus.PAID && record.status !== SalaryStatus.PAID) {
        updateData.paidAt = new Date();
      }
      // If setting to PENDING from PAID, clear paidAt
      if (dto.status === SalaryStatus.PENDING && record.status === SalaryStatus.PAID) {
        updateData.paidAt = null;
      }
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    return this.prisma.salaryRecord.update({
      where: { id },
      data: updateData,
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

  /**
   * Get salary breakdown by teacher and month (lesson-level details)
   */
  async getSalaryBreakdown(teacherId: string, month: string) {
    // Parse month string (YYYY-MM format)
    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Invalid month format. Expected YYYY-MM');
    }

    // Get teacher
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Get start and end of month
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

    // Get ALL lessons for this month (not just completed ones)
    const lessons = await this.prisma.lesson.findMany({
      where: {
        teacherId,
        scheduledAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        // Exclude cancelled lessons
        status: {
          not: LessonStatus.CANCELLED,
        },
      },
      select: {
        id: true,
        topic: true,
        scheduledAt: true,
        completedAt: true,
        duration: true,
        absenceMarked: true,
        feedbacksCompleted: true,
        voiceSent: true,
        textSent: true,
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // Get other deductions for this period (from Deduction table)
    const otherDeductions = await this.prisma.deduction.findMany({
      where: {
        teacherId,
        appliedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        amount: true,
        lessonId: true,
      },
    });

    // Create a map of lessonId -> deductions
    const deductionsByLessonId = new Map<string, number>();
    otherDeductions.forEach((deduction) => {
      if (deduction.lessonId) {
        const current = deductionsByLessonId.get(deduction.lessonId) || 0;
        deductionsByLessonId.set(deduction.lessonId, current + Number(deduction.amount));
      }
    });

    // Get lesson rate: use lessonRateAMD if set, otherwise fall back to hourlyRate (assuming 1 hour = 1 lesson)
    const lessonRate = teacher.lessonRateAMD 
      ? Number(teacher.lessonRateAMD) 
      : Number(teacher.hourlyRate); // Fallback for backward compatibility

    // Calculate per-lesson breakdown using proportional calculation
    // Base salary is per lesson (fixed price), NOT per hour
    const lessonBreakdown = lessons.map((lesson: any) => {
      // Base salary = lessonRateAMD (fixed price per lesson)
      const baseSalary = lessonRate;

      // Calculate completed actions (4 total)
      const completedActions = [
        lesson.absenceMarked ?? false,
        lesson.feedbacksCompleted ?? false,
        lesson.voiceSent ?? false,
        lesson.textSent ?? false,
      ].filter(Boolean).length;
      const totalActions = 4;

      // Proportional calculation: earned = baseSalary * (completedActions / 4)
      const earned = baseSalary * (completedActions / totalActions);

      // Get other deductions for this lesson
      const otherDeductionForLesson = deductionsByLessonId.get(lesson.id) || 0;

      // Total = earned - other deductions
      const total = Math.max(0, earned - otherDeductionForLesson);

      // Deduction = baseSalary - earned (implicit deduction for missing actions)
      const deduction = baseSalary - earned + otherDeductionForLesson;

      // Lesson name: use topic if available, otherwise use group name + date
      const lessonName = lesson.topic || lesson.group?.name || 'Untitled Lesson';

      return {
        lessonId: lesson.id,
        lessonName,
        lessonDate: lesson.scheduledAt, // Use scheduledAt instead of completedAt
        obligationCompleted: completedActions,
        obligationTotal: totalActions,
        salary: baseSalary,
        deduction: deduction,
        total,
      };
    });

    return {
      teacherId,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      month: month,
      lessons: lessonBreakdown,
    };
  }

  /**
   * Delete a salary record
   */
  async delete(id: string) {
    const record = await this.prisma.salaryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

    return this.prisma.salaryRecord.delete({
      where: { id },
    });
  }

  /**
   * Delete multiple salary records
   */
  async deleteMany(ids: string[]) {
    return this.prisma.salaryRecord.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  /**
   * Exclude lessons from salary calculation by changing their status to CANCELLED
   * This removes them from salary breakdown without deleting the lessons
   */
  async excludeLessonsFromSalary(lessonIds: string[]) {
    if (!lessonIds || lessonIds.length === 0) {
      throw new BadRequestException('Lesson IDs array is required and cannot be empty');
    }

    // Verify all lessons exist and are COMPLETED
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        status: LessonStatus.COMPLETED,
      },
      select: { id: true },
    });

    if (lessons.length !== lessonIds.length) {
      const foundIds = new Set(lessons.map((l) => l.id));
      const missingIds = lessonIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Some lessons not found or not completed: ${missingIds.join(', ')}`
      );
    }

    // Change status to CANCELLED to exclude from salary calculation
    const result = await this.prisma.lesson.updateMany({
      where: {
        id: { in: lessonIds },
        status: LessonStatus.COMPLETED,
      },
      data: {
        status: LessonStatus.CANCELLED,
      },
    });

    return {
      count: result.count,
      lessonIds: lessonIds,
    };
  }
}
