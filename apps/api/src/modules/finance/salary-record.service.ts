import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SalaryStatus, LessonStatus } from '@prisma/client';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { SalaryCalculationService } from './salary-calculation.service';

/**
 * Service responsible for salary record CRUD operations
 */
@Injectable()
export class SalaryRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationService: SalaryCalculationService,
  ) {}

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
          const computedSalary = await this.calculationService.calculateMonthlySalaryFromLessons(
            salaryRecord.teacherId,
            salaryRecord.month
          );

          return {
            ...salaryRecord,
            // Override netAmount with computed salary from completed lessons
            netAmount: computedSalary,
            obligationsInfo,
            // Transform DateTime month to separate month and year numbers for frontend
            month: salaryRecord.month.getMonth() + 1, // 1-12
            year: salaryRecord.month.getFullYear(),
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
          const computedSalary = await this.calculationService.calculateMonthlySalaryFromLessons(
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
            month: defaultMonth.getMonth() + 1, // 1-12
            year: defaultMonth.getFullYear(),
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
      },
    });

    // Calculate action breakdown
    const lessonDataList = lessons as unknown as Array<{
      absenceMarked: boolean | null;
      feedbacksCompleted: boolean | null;
      voiceSent: boolean | null;
      textSent: boolean | null;
    }>;
    const actionBreakdown = {
      absenceMarked: {
        completed: lessonDataList.filter((l) => l.absenceMarked ?? false).length,
        required: lessons.length,
      },
      feedbacksCompleted: {
        completed: lessonDataList.filter((l) => l.feedbacksCompleted ?? false).length,
        required: lessons.length,
      },
      voiceSent: {
        completed: lessonDataList.filter((l) => l.voiceSent ?? false).length,
        required: lessons.length,
      },
      textSent: {
        completed: lessonDataList.filter((l) => l.textSent ?? false).length,
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

    const updateData: {
      status?: SalaryStatus;
      paidAt?: Date | null;
      notes?: string | null;
    } = {};
    
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
}



