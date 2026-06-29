import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChangeStatusDto } from './dto';
import { CrmLeadStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { StudentsService } from '../students/students.service';
import {
  canTransition,
  getAllowedNextStatuses,
  requireFieldsForTransition,
  CRM_COLUMN_ORDER,
} from './crm-status.machine';
import { LeadReadService } from './lead-read.service';
import { leadInclude } from './lead-include.util';

@Injectable()
export class LeadStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readService: LeadReadService,
    private readonly studentsService: StudentsService,
  ) {}

  async changeStatus(
    id: string,
    dto: ChangeStatusDto,
    actorUserId: string,
    options?: { isTeacherApprove?: boolean; user?: JwtPayload },
  ) {
    const lead = await this.readService.findById(id, actorUserId, options?.user);
    const from = lead.status;
    const to = dto.status;

    if (from === 'PAID') {
      if (to !== 'PAID') {
        throw new BadRequestException(
          'Lead status cannot be changed after it has been set to Paid.',
        );
      }
      return this.readService.findById(id, actorUserId, options?.user);
    }

    const adminCanSetAnyStatus = options?.user?.role === 'ADMIN';
    if (!adminCanSetAnyStatus) {
      if (!canTransition(from, to, { isTeacherApprove: options?.isTeacherApprove })) {
        throw new BadRequestException(`Transition from ${from} to ${to} is not allowed`);
      }
    }

    const requiredFields = adminCanSetAnyStatus ? [] : requireFieldsForTransition(from, to);
    const isVoiceLead = (lead as { attachments?: { type: string }[] }).attachments?.some(
      (a) => a.type === 'VOICE_RECORDING',
    );
    if (requiredFields.length > 0 && !isVoiceLead) {
      const missing: string[] = [];
      for (const key of requiredFields) {
        const v = lead[key as keyof typeof lead];
        if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
          missing.push(key);
        }
      }
      if (missing.length > 0) {
        throw new BadRequestException(
          `Cannot move to ${to}: missing required fields: ${missing.join(', ')}`,
        );
      }
    }

    if (to === 'PAID') {
      throw new BadRequestException(
        'Marking a lead as Paid requires completing student registration. Use POST /crm/leads/:id/register-paid.',
      );
    }

    const updateData: { status: CrmLeadStatus; archivedReason?: string } = {
      status: to,
    };
    if (to === 'ARCHIVE' && dto.archivedReason) {
      updateData.archivedReason = dto.archivedReason;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedLead = await tx.crmLead.update({
        where: { id },
        data: updateData,
        include: leadInclude(),
      });

      await tx.crmLeadActivity.create({
        data: {
          leadId: id,
          actorUserId,
          type: 'STATUS_CHANGE',
          payload: { fromStatus: from, toStatus: to },
        },
      });

      return updatedLead;
    });

    return updated;
  }

  async registerPaidLead(
    id: string,
    dto: CreateStudentDto,
    actorUserId: string,
    user?: JwtPayload,
  ) {
    const lead = await this.readService.findById(id, actorUserId, user);
    if ((lead as { student?: { id: string } | null }).student) {
      return this.readService.findById(id, actorUserId, user);
    }

    const adminCanSetAnyStatus = user?.role === 'ADMIN';
    const fromStatus = lead.status;
    const isPaidWithoutStudent = fromStatus === 'PAID';
    if (!isPaidWithoutStudent && !adminCanSetAnyStatus) {
      const approved = (lead as { teacherApprovedAt?: Date | null }).teacherApprovedAt != null;
      if (!canTransition(fromStatus, 'PAID', { isTeacherApprove: approved })) {
        throw new BadRequestException(
          `Cannot register as Paid from status ${fromStatus}: transition not allowed`,
        );
      }
    }

    await this.studentsService.createLinkedToCrmPaidLead(id, dto, actorUserId, user);
    return this.readService.findById(id, actorUserId, user);
  }

  getAllowedTransitions(status: CrmLeadStatus): CrmLeadStatus[] {
    return getAllowedNextStatuses(status);
  }

  getStatuses(): CrmLeadStatus[] {
    return [...CRM_COLUMN_ORDER];
  }
}
