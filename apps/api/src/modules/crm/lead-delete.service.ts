import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadReadService } from './lead-read.service';

@Injectable()
export class LeadDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly readService: LeadReadService,
  ) {}

  async delete(id: string, user?: JwtPayload) {
    const lead = await this.readService.findById(id, user?.sub, user);
    const attachments = (lead as { attachments?: { r2Key: string }[] }).attachments ?? [];
    for (const a of attachments) {
      if (a.r2Key) {
        try {
          await this.storage.delete(a.r2Key);
        } catch {
          // Best effort: continue even if R2 delete fails
        }
      }
    }
    await this.prisma.crmLead.delete({ where: { id } });
  }
}
