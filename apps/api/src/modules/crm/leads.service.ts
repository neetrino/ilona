import { Injectable } from '@nestjs/common';
import {
  CreateLeadDto,
  UpdateLeadDto,
  ChangeStatusDto,
  ChangeBranchDto,
  TeacherTransferDto,
  AddCommentDto,
  ConfirmRecordingDto,
} from './dto';
import { CrmLeadStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { CreateLeadFromVoiceOptions } from './lead.types';
import { LeadListService } from './lead-list.service';
import { LeadReadService } from './lead-read.service';
import { LeadCreateService } from './lead-create.service';
import { LeadUpdateService } from './lead-update.service';
import { LeadDeleteService } from './lead-delete.service';
import { LeadStatusService } from './lead-status.service';
import { LeadVoiceService } from './lead-voice.service';
import { LeadActivityService } from './lead-activity.service';
import { LeadTeacherService } from './lead-teacher.service';

export type { CreateLeadFromVoiceOptions } from './lead.types';

/** Facade for CRM leads — delegates to domain-specific services. */
@Injectable()
export class LeadsService {
  constructor(
    private readonly listService: LeadListService,
    private readonly readService: LeadReadService,
    private readonly createService: LeadCreateService,
    private readonly updateService: LeadUpdateService,
    private readonly deleteService: LeadDeleteService,
    private readonly statusService: LeadStatusService,
    private readonly voiceService: LeadVoiceService,
    private readonly activityService: LeadActivityService,
    private readonly teacherService: LeadTeacherService,
  ) {}

  create(dto: CreateLeadDto, createdByUserId: string, user?: JwtPayload) {
    return this.createService.create(dto, createdByUserId, user);
  }

  createLeadFromVoice(
    file: Express.Multer.File,
    createdByUserId: string,
    user?: JwtPayload,
    options: CreateLeadFromVoiceOptions = {},
  ) {
    return this.voiceService.createLeadFromVoice(file, createdByUserId, user, options);
  }

  findVoiceAppRecordingsForAdmin(user?: JwtPayload) {
    return this.voiceService.findVoiceAppRecordingsForAdmin(user);
  }

  updateVoiceAppRecordingCenter(leadId: string, centerId: string, user?: JwtPayload) {
    return this.voiceService.updateVoiceAppRecordingCenter(leadId, centerId, user);
  }

  findAll(
    query: {
      skip?: number;
      take?: number;
      search?: string;
      status?: CrmLeadStatus;
      centerId?: string;
      teacherId?: string;
      groupId?: string;
      levelId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
    user?: JwtPayload,
  ) {
    return this.listService.findAll(query, user);
  }

  findById(id: string, userId?: string, user?: JwtPayload) {
    return this.readService.findById(id, userId, user);
  }

  update(id: string, dto: UpdateLeadDto, actorUserId: string, user?: JwtPayload) {
    return this.updateService.update(id, dto, actorUserId, user);
  }

  delete(id: string, user?: JwtPayload) {
    return this.deleteService.delete(id, user);
  }

  changeStatus(
    id: string,
    dto: ChangeStatusDto,
    actorUserId: string,
    options?: { isTeacherApprove?: boolean; user?: JwtPayload },
  ) {
    return this.statusService.changeStatus(id, dto, actorUserId, options);
  }

  registerPaidLead(id: string, dto: CreateStudentDto, actorUserId: string, user?: JwtPayload) {
    return this.statusService.registerPaidLead(id, dto, actorUserId, user);
  }

  changeBranch(id: string, dto: ChangeBranchDto, actorUserId: string, user?: JwtPayload) {
    return this.updateService.changeBranch(id, dto, actorUserId, user);
  }

  getActivities(leadId: string, user?: JwtPayload) {
    return this.activityService.getActivities(leadId, user);
  }

  addComment(leadId: string, dto: AddCommentDto, actorUserId: string, user?: JwtPayload) {
    return this.activityService.addComment(leadId, dto, actorUserId, user);
  }

  getPresignedRecordingUrl(
    leadId: string,
    fileName: string,
    mimeType: string,
    user?: JwtPayload,
  ) {
    return this.voiceService.getPresignedRecordingUrl(leadId, fileName, mimeType, user);
  }

  confirmRecording(
    leadId: string,
    dto: ConfirmRecordingDto,
    actorUserId: string,
    user?: JwtPayload,
  ) {
    return this.voiceService.confirmRecording(leadId, dto, actorUserId, user);
  }

  getAllowedTransitions(status: CrmLeadStatus): CrmLeadStatus[] {
    return this.statusService.getAllowedTransitions(status);
  }

  getStatuses(): CrmLeadStatus[] {
    return this.statusService.getStatuses();
  }

  findForTeacher(teacherUserId: string, query: { groupId?: string }) {
    return this.listService.findForTeacher(teacherUserId, query);
  }

  teacherApprove(leadId: string, teacherUserId: string) {
    return this.teacherService.teacherApprove(leadId, teacherUserId);
  }

  teacherTransfer(leadId: string, dto: TeacherTransferDto, teacherUserId: string) {
    return this.teacherService.teacherTransfer(leadId, dto, teacherUserId);
  }
}
