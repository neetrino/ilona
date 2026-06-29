import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ConfirmRecordingDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
import { parseDurationSecForVoice } from './voice-duration.util';
import { LeadAccessService } from './lead-access.service';
import { LeadReadService } from './lead-read.service';
import { LeadActivityService } from './lead-activity.service';
import { CreateLeadFromVoiceOptions, VoiceLeadHistoryLite } from './lead.types';

@Injectable()
export class LeadVoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly accessService: LeadAccessService,
    private readonly readService: LeadReadService,
    private readonly activityService: LeadActivityService,
  ) {}

  async createLeadFromVoice(
    file: Express.Multer.File,
    createdByUserId: string,
    user?: JwtPayload,
    options: CreateLeadFromVoiceOptions = {},
  ) {
    this.accessService.requireAdminForCrmLeadVoice(user);
    if (!file?.buffer?.length) {
      throw new BadRequestException('No audio file provided');
    }

    const trimmedCenterId = options.centerId?.trim();
    const durationParsing = options.durationParsing ?? 'loose';
    const durationSec = parseDurationSecForVoice(options.durationSecRaw, durationParsing);
    const centerId = await this.resolveCenterIdForVoiceLead(options, trimmedCenterId, user);

    const leadSource =
      options.leadSource !== undefined && options.leadSource !== null && options.leadSource !== ''
        ? options.leadSource
        : undefined;

    const lead = await this.prisma.crmLead.create({
      data: {
        status: 'NEW',
        createdByUserId,
        centerId,
        ...(leadSource !== undefined ? { source: leadSource } : {}),
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
        ...(durationSec !== undefined ? { durationSec } : {}),
      },
    });
    const activitySource = leadSource === 'VOICE_APP' ? 'VOICE_APP' : 'voice_lead';
    await this.activityService.logActivity(lead.id, createdByUserId, 'RECORDING_UPLOADED', {
      source: activitySource,
      key: uploadResult.key,
    });
    return this.readService.findById(lead.id);
  }

  async findVoiceAppRecordingsForAdmin(user?: JwtPayload) {
    this.accessService.ensureAdminForVoiceRecordingsHistory(user);
    const leads = await this.prisma.crmLead.findMany({
      where: {
        status: 'NEW',
        source: 'VOICE_APP',
        attachments: {
          some: {
            type: 'VOICE_RECORDING',
          },
        },
      },
      include: {
        center: { select: { id: true, name: true } },
        attachments: {
          where: { type: 'VOICE_RECORDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return leads.map((lead) => this.formatVoiceRecordingHistoryItem(lead));
  }

  async updateVoiceAppRecordingCenter(leadId: string, centerId: string, user?: JwtPayload) {
    this.accessService.ensureAdminForVoiceRecordingsHistory(user);
    const normalizedCenterId = centerId.trim();
    if (!normalizedCenterId) {
      throw new BadRequestException('centerId is required');
    }

    const lead = await this.prisma.crmLead.findUnique({
      where: { id: leadId },
      include: {
        center: { select: { id: true, name: true } },
        attachments: {
          where: { type: 'VOICE_RECORDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }
    if (lead.status !== 'NEW') {
      throw new BadRequestException('Only NEW leads are allowed for voice recording center update');
    }
    if (lead.source !== 'VOICE_APP') {
      throw new BadRequestException('Lead source must be VOICE_APP');
    }
    if (lead.attachments.length === 0) {
      throw new BadRequestException('Lead has no VOICE_RECORDING attachment');
    }

    const center = await this.prisma.center.findUnique({
      where: { id: normalizedCenterId },
      select: { id: true, name: true, isActive: true },
    });
    if (!center) {
      throw new NotFoundException(`Center ${normalizedCenterId} not found`);
    }
    if (!center.isActive) {
      throw new BadRequestException('This center is not active');
    }

    const updatedLead = await this.prisma.crmLead.update({
      where: { id: leadId },
      data: { centerId: center.id },
      include: {
        center: { select: { id: true, name: true } },
        attachments: {
          where: { type: 'VOICE_RECORDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.formatVoiceRecordingHistoryItem(updatedLead);
  }

  async getPresignedRecordingUrl(
    leadId: string,
    fileName: string,
    mimeType: string,
    user?: JwtPayload,
  ) {
    this.accessService.requireAdminForCrmLeadVoice(user);
    await this.readService.findById(leadId, user?.sub, user);
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
    user?: JwtPayload,
  ) {
    this.accessService.requireAdminForCrmLeadVoice(user);
    await this.readService.findById(leadId, actorUserId, user);
    const attachment = await this.prisma.crmLeadAttachment.create({
      data: {
        leadId,
        type: 'VOICE_RECORDING',
        r2Key: dto.key,
        mimeType: dto.mimeType,
        size: dto.size ?? null,
      },
    });
    await this.activityService.logActivity(leadId, actorUserId, 'RECORDING_UPLOADED', {
      attachmentId: attachment.id,
      key: dto.key,
    });
    return this.readService.findById(leadId, actorUserId, user);
  }

  private async resolveCenterIdForVoiceLead(
    options: CreateLeadFromVoiceOptions,
    trimmedCenterId: string | undefined,
    user?: JwtPayload,
  ): Promise<string | undefined> {
    if (options.requireActiveCenter) {
      if (!trimmedCenterId) {
        throw new BadRequestException('centerId is required');
      }
      const center = await this.prisma.center.findUnique({
        where: { id: trimmedCenterId },
        select: { id: true, isActive: true },
      });
      if (!center) {
        throw new NotFoundException(`Center ${trimmedCenterId} not found`);
      }
      if (!center.isActive) {
        throw new BadRequestException('This center is not active');
      }
      return center.id;
    }
    return this.accessService.ensureManagerCenterInput(trimmedCenterId, user);
  }

  private formatVoiceRecordingHistoryItem(lead: VoiceLeadHistoryLite) {
    const latestAttachment = lead.attachments[0];
    if (!latestAttachment) {
      throw new BadRequestException('Voice recording attachment is missing');
    }
    return {
      leadId: lead.id,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt,
      centerId: lead.centerId,
      centerName: lead.center?.name ?? null,
      attachment: {
        id: latestAttachment.id,
        r2Key: latestAttachment.r2Key,
        durationSec: latestAttachment.durationSec ?? null,
        mimeType: latestAttachment.mimeType,
        size: latestAttachment.size,
        createdAt: latestAttachment.createdAt,
      },
      audioPath: `/storage/file/${encodeURIComponent(latestAttachment.r2Key)}`,
    };
  }
}
