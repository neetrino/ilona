import { Injectable } from '@nestjs/common';
import { SalaryStatus } from '@ilona/database';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { SalaryGenerationService } from './salary-generation.service';
import { SalaryRecordService } from './salary-record.service';
import { SalaryBreakdownService } from './salary-breakdown.service';

/**
 * Main Salaries Service - Facade that delegates to specialized services
 * This maintains backward compatibility while keeping the codebase organized
 */
@Injectable()
export class SalariesService {
  constructor(
    private readonly generationService: SalaryGenerationService,
    private readonly recordService: SalaryRecordService,
    private readonly breakdownService: SalaryBreakdownService,
  ) {}

  // Calculation Methods
  async recalculateSalaryForMonth(teacherId: string, month: Date): Promise<void> {
    return this.generationService.recalculateSalaryForMonth(teacherId, month);
  }

  // Record CRUD Methods
  async findAll(params?: {
    skip?: number;
    take?: number;
    teacherId?: string;
    status?: SalaryStatus;
    dateFrom?: Date;
    dateTo?: Date;
    q?: string;
    centerId?: string;
  }): Promise<unknown> {
    return this.recordService.findAll(params);
  }

  /**
   * Get all salary records for a single teacher (one per month).
   * Used by Teacher "my salaries" - same data shape as Admin but scoped to one teacher.
   */
  async findAllRecordsByTeacher(
    teacherId: string,
    params?: {
      skip?: number;
      take?: number;
      status?: SalaryStatus;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<unknown> {
    return this.recordService.findAllRecordsByTeacher(teacherId, params);
  }

  async findById(id: string): Promise<unknown> {
    return this.recordService.findById(id);
  }

  async create(dto: CreateSalaryRecordDto): Promise<unknown> {
    return this.recordService.create(dto);
  }

  async update(id: string, dto: UpdateSalaryDto): Promise<unknown> {
    return this.recordService.update(id, dto);
  }

  async delete(id: string): Promise<unknown> {
    return this.recordService.delete(id);
  }

  async deleteMany(ids: string[]) {
    return this.recordService.deleteMany(ids);
  }

  async processSalary(id: string, dto: ProcessSalaryDto): Promise<unknown> {
    return this.recordService.processSalary(id, dto);
  }

  // Generation Methods
  async generateSalaryRecord(teacherId: string, month: Date): Promise<unknown> {
    return this.generationService.generateSalaryRecord(teacherId, month);
  }

  async generateMonthlySalaries(year: number, month: number): Promise<unknown> {
    return this.generationService.generateMonthlySalaries(year, month);
  }

  // Breakdown Methods
  async getSalaryBreakdown(teacherId: string, month: string) {
    return this.breakdownService.getSalaryBreakdown(teacherId, month);
  }

  async getLessonObligation(lessonId: string) {
    return this.breakdownService.getLessonObligation(lessonId);
  }

  async getTeacherSalarySummary(teacherId: string) {
    return this.breakdownService.getTeacherSalarySummary(teacherId);
  }

  async excludeLessonsFromSalary(lessonIds: string[]) {
    return this.breakdownService.excludeLessonsFromSalary(lessonIds);
  }
}
