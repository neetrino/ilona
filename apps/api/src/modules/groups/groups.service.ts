import { Injectable } from '@nestjs/common';
import { CreateGroupDto, UpdateGroupDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { GroupQueryService } from './group-query.service';
import { GroupWriteService } from './group-write.service';
import { GroupMembershipService } from './group-membership.service';

/** Facade for group management — delegates to domain-specific services. */
@Injectable()
export class GroupsService {
  constructor(
    private readonly queryService: GroupQueryService,
    private readonly writeService: GroupWriteService,
    private readonly membershipService: GroupMembershipService,
  ) {}

  findAll(params?: Parameters<GroupQueryService['findAll']>[0]) {
    return this.queryService.findAll(params);
  }

  findStudentsByGroupId(
    groupId: string,
    params?: { skip?: number; take?: number },
    currentUser?: JwtPayload,
  ) {
    return this.queryService.findStudentsByGroupId(groupId, params, currentUser);
  }

  findById(id: string, currentUser?: JwtPayload) {
    return this.queryService.findById(id, currentUser);
  }

  getTeacherByUserId(userId: string) {
    return this.queryService.getTeacherByUserId(userId);
  }

  findByTeacher(teacherId: string) {
    return this.queryService.findByTeacher(teacherId);
  }

  findByTeacherUserId(userId: string) {
    return this.queryService.findByTeacherUserId(userId);
  }

  create(dto: CreateGroupDto, currentUser?: JwtPayload) {
    return this.writeService.create(dto, currentUser);
  }

  update(id: string, dto: UpdateGroupDto, currentUser?: JwtPayload) {
    return this.writeService.update(id, dto, currentUser);
  }

  delete(id: string, currentUser?: JwtPayload) {
    return this.writeService.delete(id, currentUser);
  }

  toggleActive(id: string, currentUser?: JwtPayload, reason?: string) {
    return this.writeService.toggleActive(id, currentUser, reason);
  }

  assignTeacher(groupId: string, teacherId: string, currentUser?: JwtPayload) {
    return this.membershipService.assignTeacher(groupId, teacherId, currentUser);
  }

  addStudent(groupId: string, studentId: string, currentUser?: JwtPayload) {
    return this.membershipService.addStudent(groupId, studentId, currentUser);
  }

  removeStudent(groupId: string, studentId: string, currentUser?: JwtPayload) {
    return this.membershipService.removeStudent(groupId, studentId, currentUser);
  }
}
