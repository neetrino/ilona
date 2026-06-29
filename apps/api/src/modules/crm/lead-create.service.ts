import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadAccessService } from './lead-access.service';
import { LeadActivityService } from './lead-activity.service';
import { leadInclude } from './lead-include.util';

@Injectable()
export class LeadCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: LeadAccessService,
    private readonly activityService: LeadActivityService,
  ) {}

  async create(dto: CreateLeadDto, createdByUserId: string, user?: JwtPayload) {
    await this.accessService.assertManagerLeadTeacherInCenter(dto.teacherId, user);
    const centerId = this.accessService.ensureManagerCenterInput(dto.centerId, user);
    const lead = await this.prisma.crmLead.create({
      data: {
        status: 'NEW',
        createdByUserId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        age: dto.age,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        parentEmail: dto.parentEmail,
        parentPassportInfo: dto.parentPassportInfo,
        firstLessonDate: dto.firstLessonDate ? new Date(dto.firstLessonDate) : undefined,
        comment: dto.comment,
        levelId: dto.levelId,
        teacherId: dto.teacherId,
        groupId: dto.groupId,
        centerId,
        source: dto.source,
        notes: dto.notes,
      },
      include: leadInclude(),
    });
    await this.activityService.logActivity(lead.id, createdByUserId, 'STATUS_CHANGE', {
      toStatus: 'NEW',
      source: 'create',
    });
    return lead;
  }
}
