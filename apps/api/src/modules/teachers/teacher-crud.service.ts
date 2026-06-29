import { Injectable } from '@nestjs/common';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { UserStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { TeacherListService } from './teacher-list.service';
import { TeacherReadService } from './teacher-read.service';
import { TeacherWriteService } from './teacher-write.service';

/** Facade for teacher CRUD — delegates to domain-specific services. */
@Injectable()
export class TeacherCrudService {
  constructor(
    private readonly listService: TeacherListService,
    private readonly readService: TeacherReadService,
    private readonly writeService: TeacherWriteService,
  ) {}

  findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    currentUser?: JwtPayload;
  }) {
    return this.listService.findAll(params);
  }

  findById(id: string, currentUser?: JwtPayload) {
    return this.readService.findById(id, currentUser);
  }

  findByUserId(userId: string) {
    return this.readService.findByUserId(userId);
  }

  create(dto: CreateTeacherDto, currentUser?: JwtPayload) {
    return this.writeService.create(dto, currentUser);
  }

  update(id: string, dto: UpdateTeacherDto, currentUser?: JwtPayload) {
    return this.writeService.update(id, dto, currentUser);
  }

  delete(id: string, currentUser?: JwtPayload) {
    return this.writeService.delete(id, currentUser);
  }

  deleteMany(ids: string[], currentUser?: JwtPayload) {
    return this.writeService.deleteMany(ids, currentUser);
  }
}
