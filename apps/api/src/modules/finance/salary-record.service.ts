import { Injectable } from '@nestjs/common';
import { CreateSalaryRecordDto, ProcessSalaryDto, UpdateSalaryDto } from './dto/create-salary-record.dto';
import { SalaryRecordListService } from './salary-record-list.service';
import { SalaryRecordReadService } from './salary-record-read.service';
import { SalaryRecordWriteService } from './salary-record-write.service';
import type { SalaryListParams, SalaryTeacherListParams } from './salary-record.types';

/** Facade for salary record CRUD — delegates to list, read, and write services. */
@Injectable()
export class SalaryRecordService {
  constructor(
    private readonly listService: SalaryRecordListService,
    private readonly readService: SalaryRecordReadService,
    private readonly writeService: SalaryRecordWriteService,
  ) {}

  findAll(params?: SalaryListParams) {
    return this.listService.findAll(params);
  }

  findAllRecordsByTeacher(teacherId: string, params?: SalaryTeacherListParams) {
    return this.listService.findAllRecordsByTeacher(teacherId, params);
  }

  findById(id: string) {
    return this.readService.findById(id);
  }

  create(dto: CreateSalaryRecordDto) {
    return this.writeService.create(dto);
  }

  processSalary(id: string, dto: ProcessSalaryDto) {
    return this.writeService.processSalary(id, dto);
  }

  update(id: string, dto: UpdateSalaryDto) {
    return this.writeService.update(id, dto);
  }

  delete(id: string) {
    return this.writeService.delete(id);
  }

  deleteMany(ids: string[]) {
    return this.writeService.deleteMany(ids);
  }
}
