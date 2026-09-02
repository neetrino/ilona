import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLeadDto, ChangeBranchDto } from './dto';
import { UserRole } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadAccessService } from './lead-access.service';
import { LeadReadService } from './lead-read.service';
import { LeadActivityService } from './lead-activity.service';
import { leadInclude } from './lead-include.util';

@Injectable()
export class LeadUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: LeadAccessService,
    private readonly readService: LeadReadService,
    private readonly activityService: LeadActivityService,
  ) {}

  async update(id: string, dto: UpdateLeadDto, actorUserId: string, user?: JwtPayload) {
    await this.readService.findById(id, actorUserId, user);
    const isManager = user?.role === UserRole.MANAGER;
    if (isManager) {
      await this.accessService.assertManagerLeadTeacherInCenter(dto.teacherId, user);
    }

    const updated = await this.prisma.crmLead.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        age: dto.age,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        parentEmail: dto.parentEmail,
        firstLessonDate: dto.firstLessonDate ? new Date(dto.firstLessonDate) : undefined,
        comment: dto.comment,
        levelId: dto.levelId,
        teacherId: dto.teacherId,
        groupId: dto.groupId,
        ...(isManager
          ? {}
          : { centerId: this.accessService.ensureManagerCenterInput(dto.centerId, user) }),
        source: dto.source,
        notes: dto.notes,
        assignedManagerId: dto.assignedManagerId,
        transferFlag: dto.transferFlag,
        transferComment: dto.transferComment,
        archivedReason: dto.archivedReason,
      },
      include: leadInclude(),
    });
    await this.activityService.logActivity(id, actorUserId, 'FIELD_UPDATE', {
      updatedFields: Object.keys(dto),
    });
    return updated;
  }

  async changeBranch(id: string, dto: ChangeBranchDto, actorUserId: string, user?: JwtPayload) {
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can change lead branch');
    }

    const lead = await this.readService.findById(id, actorUserId, user);
    const nextCenterId = dto.centerId ?? null;
    const previousCenterId = lead.centerId ?? null;

    const managerProfile = nextCenterId
      ? await this.prisma.managerProfile.findFirst({
          where: {
            centerId: nextCenterId,
            isCurrentAssignment: true,
            user: { status: 'ACTIVE' },
          },
          select: { userId: true },
        })
      : null;
    const nextAssignedManagerId = managerProfile?.userId ?? null;

    const updatedLead = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.crmLead.update({
        where: { id },
        data: {
          centerId: nextCenterId,
          assignedManagerId: nextAssignedManagerId,
        },
        include: leadInclude(),
      });

      await tx.crmLeadActivity.create({
        data: {
          leadId: id,
          actorUserId,
          type: 'FIELD_UPDATE',
          payload: {
            field: 'centerId',
            fromCenterId: previousCenterId,
            toCenterId: nextCenterId,
            assignedManagerId: nextAssignedManagerId,
          },
        },
      });

      return updated;
    });

    return updatedLead;
  }
}
