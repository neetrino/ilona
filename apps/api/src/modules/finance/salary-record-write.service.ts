import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalaryStatus } from '@ilona/database';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { getSalaryRecordDb, salaryRecordTeacherInclude } from './salary-record-db.util';

@Injectable()
export class SalaryRecordWriteService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return getSalaryRecordDb(this.prisma);
  }

  async create(dto: CreateSalaryRecordDto) {
    const teacher = await this.db.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new BadRequestException(`Teacher with ID ${dto.teacherId} not found`);
    }

    const totalDeductions = dto.totalDeductions || 0;
    const netAmount = dto.grossAmount - totalDeductions;

    return this.db.salaryRecord.create({
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
      include: salaryRecordTeacherInclude,
    });
  }

  async processSalary(id: string, dto: ProcessSalaryDto) {
    const record = await this.db.salaryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

    if (record.status === SalaryStatus.PAID) {
      throw new BadRequestException('Salary is already paid');
    }

    return this.db.salaryRecord.update({
      where: { id },
      data: {
        status: SalaryStatus.PAID,
        paidAt: new Date(),
        notes: dto.notes || record.notes,
      },
      include: salaryRecordTeacherInclude,
    });
  }

  async update(id: string, dto: UpdateSalaryDto) {
    const record = await this.db.salaryRecord.findUnique({
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
      const validStatuses: SalaryStatus[] = [SalaryStatus.PENDING, SalaryStatus.PAID];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status: ${dto.status}. Only PENDING and PAID are allowed.`,
        );
      }
      updateData.status = dto.status;

      if (dto.status === SalaryStatus.PAID && record.status !== SalaryStatus.PAID) {
        updateData.paidAt = new Date();
      }
      if (dto.status === SalaryStatus.PENDING && record.status === SalaryStatus.PAID) {
        updateData.paidAt = null;
      }
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    return this.db.salaryRecord.update({
      where: { id },
      data: updateData,
      include: salaryRecordTeacherInclude,
    });
  }

  async delete(id: string) {
    const record = await this.db.salaryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException(`Salary record with ID ${id} not found`);
    }

    return this.db.salaryRecord.delete({
      where: { id },
    });
  }

  async deleteMany(ids: string[]) {
    return this.db.salaryRecord.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
