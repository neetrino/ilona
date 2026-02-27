import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  ChangeStatusDto,
  TeacherTransferDto,
  AddCommentDto,
  ConfirmRecordingDto,
} from './dto';
import {
  canTransition,
  getAllowedNextStatuses,
  requireFieldsForTransition,
} from './crm-status.machine';
import {
  CrmLeadStatus,
  CrmLeadActivityType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type CrmLeadWhereInput = Prisma.CrmLeadWhereInput;
type TransactionClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

const DEFAULT_MONTHLY_FEE = 0; // Can be updated later by admin

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(dto: CreateLeadDto, createdByUserId: string) {
    const lead = await this.prisma.crmLead.create({
      data: {
        status: 'NEW',
        createdByUserId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        age: dto.age,
        levelId: dto.levelId,
        teacherId: dto.teacherId,
        groupId: dto.groupId,
        centerId: dto.centerId,
        source: dto.source,
        notes: dto.notes,
      },
      include: this.leadInclude(),
    });
    await this.logActivity(lead.id, createdByUserId, 'STATUS_CHANGE', {
      toStatus: 'NEW',
      source: 'create',
    });
    return lead;
  }

  /** Create a NEW lead from a voice recording (uploaded file). Stores audio in crm/recordings. */
  async createLeadFromVoice(
    file: Express.Multer.File,
    createdByUserId: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No audio file provided');
    }
    const lead = await this.prisma.crmLead.create({
      data: {
        status: 'NEW',
        createdByUserId,
      },
    });
    const uploadResult = await this.storage.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
      'crm/recordings',
    );
    await this.prisma.crmLeadAttachment.create({
      data: {
        leadId: lead.id,
        type: 'VOICE_RECORDING',
        r2Key: uploadResult.key,
        mimeType: uploadResult.mimeType,
        size: uploadResult.fileSize,
      },
    });
    await this.logActivity(lead.id, createdByUserId, 'RECORDING_UPLOADED', {
      source: 'voice_lead',
      key: uploadResult.key,
    });
    return this.findById(lead.id);
  }

  async findAll(
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
    _userRole?: UserRole,
  ) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 50;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: CrmLeadWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.centerId) where.centerId = query.centerId;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.groupId) where.groupId = query.groupId;
    if (query.levelId) where.levelId = query.levelId;

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const d = new Date(query.dateTo);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.crmLead.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: this.leadInclude(),
      }),
      this.prisma.crmLead.count({ where }),
    ]);

    const countsByStatus = await this.prisma.crmLead.groupBy({
      by: ['status'],
      where: { status: { in: ['NEW', 'AGREED', 'FIRST_LESSON', 'PROCESSING', 'PAID', 'WAITLIST', 'ARCHIVE'] } },
      _count: true,
    });
    const countMap = Object.fromEntries(
      countsByStatus.map((c) => [c.status, c._count]),
    ) as Record<CrmLeadStatus, number>;

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
      countsByStatus: countMap,
    };
  }

  async findById(id: string, _userId?: string, _userRole?: UserRole) {
    const lead = await this.prisma.crmLead.findUnique({
      where: { id },
      include: this.leadInclude(),
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  async update(
    id: string,
    dto: UpdateLeadDto,
    actorUserId: string,
    _userRole?: UserRole,
  ) {
    await this.findById(id);
    const updated = await this.prisma.crmLead.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        age: dto.age,
        levelId: dto.levelId,
        teacherId: dto.teacherId,
        groupId: dto.groupId,
        centerId: dto.centerId,
        source: dto.source,
        notes: dto.notes,
        assignedManagerId: dto.assignedManagerId,
        transferFlag: dto.transferFlag,
        transferComment: dto.transferComment,
        archivedReason: dto.archivedReason,
      },
      include: this.leadInclude(),
    });
    await this.logActivity(id, actorUserId, 'FIELD_UPDATE', {
      updatedFields: Object.keys(dto),
    });
    return updated;
  }

  async changeStatus(
    id: string,
    dto: ChangeStatusDto,
    actorUserId: string,
    options?: { isTeacherApprove?: boolean },
  ) {
    const lead = await this.findById(id);
    const from = lead.status;
    const to = dto.status as CrmLeadStatus;

    if (!canTransition(from, to, { isTeacherApprove: options?.isTeacherApprove })) {
      throw new BadRequestException(
        `Transition from ${from} to ${to} is not allowed`,
      );
    }

    const requiredFields = requireFieldsForTransition(from, to);
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
        include: this.leadInclude(),
      });

      await tx.crmLeadActivity.create({
        data: {
          leadId: id,
          actorUserId,
          type: 'STATUS_CHANGE',
          payload: { fromStatus: from, toStatus: to },
        },
      });

      if (to === 'PAID') {
        await this.createStudentFromLeadInTx(id, tx);
      }

      return updatedLead;
    });

    return updated;
  }

  /** Idempotent: create Student from lead when status becomes PAID; link student.leadId */
  private async createStudentFromLeadInTx(leadId: string, tx: TransactionClient) {
    const lead = await tx.crmLead.findUnique({
      where: { id: leadId },
      include: { student: true },
    });
    if (!lead) return;
    if (lead.student) return; // already created (idempotent)

    const existingUser = lead.phone
      ? await tx.user.findFirst({
          where: { phone: lead.phone },
        })
      : null;
    if (existingUser) {
      const existingStudent = await tx.student.findUnique({
        where: { userId: existingUser.id },
      });
      if (existingStudent) {
        await tx.student.update({
          where: { id: existingStudent.id },
          data: { leadId },
        });
        return;
      }
    }

    const email =
      lead.phone && lead.firstName
        ? `lead-${leadId.slice(0, 8)}-${Date.now()}@lead.local`
        : `lead-${leadId}@lead.local`;
    const passwordHash = await bcrypt.hash(
      `lead-${leadId}-${Date.now()}`,
      10,
    );

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName: lead.firstName ?? 'Lead',
        lastName: lead.lastName ?? '',
        phone: lead.phone,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });

    await tx.student.create({
      data: {
        userId: user.id,
        leadId,
        groupId: lead.groupId ?? undefined,
        teacherId: lead.teacherId ?? undefined,
        monthlyFee: DEFAULT_MONTHLY_FEE,
      },
    });
  }

  async getActivities(leadId: string) {
    await this.findById(leadId);
    return this.prisma.crmLeadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(leadId: string, dto: AddCommentDto, actorUserId: string) {
    await this.findById(leadId);
    await this.prisma.crmLeadActivity.create({
      data: {
        leadId,
        actorUserId,
        type: 'COMMENT',
        payload: { content: dto.content },
      },
    });
    return this.getActivities(leadId);
  }

  async getPresignedRecordingUrl(leadId: string, fileName: string, mimeType: string) {
    await this.findById(leadId);
    const result = await this.storage.getPresignedUploadUrl(
      fileName,
      mimeType,
      'crm/recordings',
      3600,
    );
    return {
      uploadUrl: result.uploadUrl,
      key: result.key,
      publicUrl: result.publicUrl,
    };
  }

  async confirmRecording(
    leadId: string,
    dto: ConfirmRecordingDto,
    actorUserId: string,
  ) {
    await this.findById(leadId);
    const attachment = await this.prisma.crmLeadAttachment.create({
      data: {
        leadId,
        type: 'VOICE_RECORDING',
        r2Key: dto.key,
        mimeType: dto.mimeType,
        size: dto.size ?? null,
      },
    });
    await this.logActivity(leadId, actorUserId, 'RECORDING_UPLOADED', {
      attachmentId: attachment.id,
      key: dto.key,
    });
    return this.findById(leadId);
  }

  getAllowedTransitions(status: CrmLeadStatus): CrmLeadStatus[] {
    return getAllowedNextStatuses(status);
  }

  // --- Teacher: leads assigned to me (teacherId + groupId) ---
  async findForTeacher(teacherUserId: string, query: { groupId?: string }) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!teacher) return { items: [], total: 0 };

    const where: CrmLeadWhereInput = {
      teacherId: teacher.id,
      status: { in: ['FIRST_LESSON', 'AGREED'] },
    };
    if (query.groupId) where.groupId = query.groupId;

    const items = await this.prisma.crmLead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: this.leadInclude(),
    });
    const total = await this.prisma.crmLead.count({ where });
    return { items, total };
  }

  async teacherApprove(leadId: string, teacherUserId: string) {
    const lead = await this.findById(leadId);
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
    return this.changeStatus(leadId, { status: 'PROCESSING' }, teacherUserId, {
      isTeacherApprove: true,
    });
  }

  async teacherTransfer(
    leadId: string,
    dto: TeacherTransferDto,
    teacherUserId: string,
  ) {
    const lead = await this.findById(leadId);
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

    await this.prisma.crmLead.update({
      where: { id: leadId },
      data: {
        transferFlag: true,
        transferComment: dto.comment,
      },
    });
    await this.logActivity(leadId, teacherUserId, 'TEACHER_TRANSFER', {
      comment: dto.comment,
    });
    return this.findById(leadId);
  }

  private leadInclude() {
    return {
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedManager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      teacher: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          level: true,
          center: { select: { id: true, name: true } },
        },
      },
      center: {
        select: { id: true, name: true },
      },
      attachments: true,
      activities: {
        take: 20,
        orderBy: { createdAt: 'desc' as const },
      },
      student: {
        select: { id: true },
      },
    };
  }

  private async logActivity(
    leadId: string,
    actorUserId: string,
    type: CrmLeadActivityType,
    payload: Record<string, unknown>,
  ) {
    await this.prisma.crmLeadActivity.create({
      data: { leadId, actorUserId, type, payload: payload as Prisma.InputJsonValue },
    });
  }
}
