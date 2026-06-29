import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherTransferDto } from './dto';
import { LeadReadService } from './lead-read.service';
import { LeadActivityService } from './lead-activity.service';

@Injectable()
export class LeadTeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readService: LeadReadService,
    private readonly activityService: LeadActivityService,
  ) {}

  async teacherApprove(leadId: string, teacherUserId: string) {
    const lead = await this.readService.findById(leadId);
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!teacher || lead.teacherId !== teacher.id) {
      throw new ForbiddenException('You are not assigned to this lead');
    }
    if (lead.status !== 'FIRST_LESSON') {
      throw new BadRequestException('Lead must be in FIRST_LESSON to approve');
    }
    if (lead.transferFlag) {
      throw new BadRequestException(
        'Lead has been marked for transfer; Approve and Transfer are mutually exclusive.',
      );
    }
    const alreadyApproved = (lead as { teacherApprovedAt?: Date | null }).teacherApprovedAt != null;
    if (alreadyApproved) {
      return this.readService.findById(leadId);
    }
    await this.prisma.crmLead.update({
      where: { id: leadId },
      data: { teacherApprovedAt: new Date() },
    });
    await this.activityService.logActivity(leadId, teacherUserId, 'TEACHER_APPROVED', {});
    return this.readService.findById(leadId);
  }

  async teacherTransfer(leadId: string, dto: TeacherTransferDto, teacherUserId: string) {
    const lead = await this.readService.findById(leadId);
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!teacher || lead.teacherId !== teacher.id) {
      throw new ForbiddenException('You are not assigned to this lead');
    }
    if (lead.status !== 'FIRST_LESSON') {
      throw new BadRequestException('Only FIRST_LESSON leads can be marked for transfer');
    }
    if (lead.teacherApprovedAt != null) {
      throw new BadRequestException(
        'Lead has already been approved; Approve and Transfer are mutually exclusive.',
      );
    }

    await this.prisma.crmLead.update({
      where: { id: leadId },
      data: {
        transferFlag: true,
        transferComment: dto.comment,
      },
    });
    await this.activityService.logActivity(leadId, teacherUserId, 'TEACHER_TRANSFER', {
      comment: dto.comment,
    });
    return this.readService.findById(leadId);
  }
}
