import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@ilona/database';
import { UserReadService } from './user-read.service';
import { UserManagerService } from './user-manager.service';
import { UserWriteService } from './user-write.service';

/** Facade for users — delegates to domain-specific services. */
@Injectable()
export class UsersService {
  constructor(
    private readonly readService: UserReadService,
    private readonly managerService: UserManagerService,
    private readonly writeService: UserWriteService,
  ) {}

  findByEmail(email: string) {
    return this.readService.findByEmail(email);
  }

  findAuthById(id: string) {
    return this.readService.findAuthById(id);
  }

  getManagerCenterId(userId: string) {
    return this.readService.getManagerCenterId(userId);
  }

  findById(id: string) {
    return this.readService.findById(id);
  }

  findAll(filters?: { role?: UserRole; status?: string }) {
    return this.readService.findAll(filters);
  }

  findManagers() {
    return this.readService.findManagers();
  }

  createManager(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    centerId: string;
  }) {
    return this.managerService.createManager(data);
  }

  updateManager(
    managerId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
      centerId?: string;
      status?: UserStatus;
    },
  ) {
    return this.managerService.updateManager(managerId, data);
  }

  updateLastLogin(userId: string) {
    return this.writeService.updateLastLogin(userId);
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.writeService.updatePassword(userId, passwordHash);
  }

  update(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
      email?: string;
      videoUrl?: string | null;
      bio?: string | null;
      experienceYears?: number | null;
    },
  ) {
    return this.writeService.update(userId, data);
  }
}
