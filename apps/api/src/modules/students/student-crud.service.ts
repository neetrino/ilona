import { Injectable } from '@nestjs/common';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { UserRole, UserStatus, StudentStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { StudentListService } from './student-list.service';
import { StudentReadService } from './student-read.service';
import { StudentCreateService } from './student-create.service';
import { StudentUpdateService } from './student-update.service';
import { StudentDeleteService } from './student-delete.service';

/** Facade for student CRUD — delegates to domain-specific services. */
@Injectable()
export class StudentCrudService {
  constructor(
    private readonly listService: StudentListService,
    private readonly readService: StudentReadService,
    private readonly createService: StudentCreateService,
    private readonly updateService: StudentUpdateService,
    private readonly deleteService: StudentDeleteService,
  ) {}

  findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    groupId?: string;
    groupIds?: string[];
    status?: UserStatus;
    statusIds?: UserStatus[];
    teacherId?: string;
    teacherIds?: string[];
    centerId?: string;
    centerIds?: string[];
    lifecycleStatuses?: StudentStatus[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    month?: number;
    year?: number;
    currentUserId?: string;
    userRole?: UserRole;
  }) {
    return this.listService.findAll(params);
  }

  findById(id: string, currentUserId?: string, userRole?: UserRole) {
    return this.readService.findById(id, currentUserId, userRole);
  }

  findByUserId(userId: string) {
    return this.readService.findByUserId(userId);
  }

  create(dto: CreateStudentDto, user?: JwtPayload) {
    return this.createService.create(dto, user);
  }

  createLinkedToCrmPaidLead(
    leadId: string,
    dto: CreateStudentDto,
    actorUserId: string,
    user?: JwtPayload,
  ) {
    return this.createService.createLinkedToCrmPaidLead(leadId, dto, actorUserId, user);
  }

  update(id: string, dto: UpdateStudentDto, user?: JwtPayload) {
    return this.updateService.update(id, dto, user);
  }

  delete(id: string, user?: JwtPayload) {
    return this.deleteService.delete(id, user);
  }

  deleteMany(ids: string[], user?: JwtPayload) {
    return this.deleteService.deleteMany(ids, user);
  }
}
