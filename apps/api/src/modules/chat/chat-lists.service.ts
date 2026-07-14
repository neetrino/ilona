import { Injectable } from '@nestjs/common';
import { ChatAdminListsService } from './chat-admin-lists.service';
import { ChatTeacherListsService } from './chat-teacher-lists.service';
import { ChatAdminContactService } from './chat-admin-contact.service';

/** Facade for chat list operations — delegates to domain-specific services. */
@Injectable()
export class ChatListsService {
  constructor(
    private readonly adminListsService: ChatAdminListsService,
    private readonly teacherListsService: ChatTeacherListsService,
    private readonly adminContactService: ChatAdminContactService,
  ) {}

  getAdminStudents(adminId: string, search?: string, branchCenterId?: string): Promise<unknown> {
    return this.adminListsService.getAdminStudents(adminId, search, branchCenterId);
  }

  getAdminTeachers(adminId: string, search?: string, branchCenterId?: string): Promise<unknown> {
    return this.adminListsService.getAdminTeachers(adminId, search, branchCenterId);
  }

  getAdminGroups(adminId: string, search?: string, branchCenterId?: string): Promise<unknown> {
    return this.adminListsService.getAdminGroups(adminId, search, branchCenterId);
  }

  getAdminAllUsers(adminId: string, search?: string, branchCenterId?: string): Promise<unknown> {
    return this.adminListsService.getAdminAllUsers(adminId, search, branchCenterId);
  }

  getTeacherGroups(teacherUserId: string, search?: string): Promise<unknown> {
    return this.teacherListsService.getTeacherGroups(teacherUserId, search);
  }

  getTeacherStudents(teacherUserId: string, search?: string): Promise<unknown> {
    return this.teacherListsService.getTeacherStudents(teacherUserId, search);
  }

  getAdminForTeacher(teacherUserId: string): Promise<unknown> {
    return this.adminContactService.getAdminForTeacher(teacherUserId);
  }

  getAdminForStudent(studentUserId: string): Promise<unknown> {
    return this.adminContactService.getAdminForStudent(studentUserId);
  }
}
