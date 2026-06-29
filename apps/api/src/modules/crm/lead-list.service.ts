import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrmLeadStatus } from '@ilona/database';
import type { Prisma } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadAccessService } from './lead-access.service';
import { leadInclude } from './lead-include.util';

type CrmLeadWhereInput = Prisma.CrmLeadWhereInput;

@Injectable()
export class LeadListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: LeadAccessService,
  ) {}

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
    user?: JwtPayload,
  ) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 50;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: CrmLeadWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.centerId) {
      where.centerId = this.accessService.ensureManagerCenterInput(query.centerId, user);
    }
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

    const scopedWhere = this.accessService.applyManagerScope(where, user);

    const [items, total] = await Promise.all([
      this.prisma.crmLead.findMany({
        where: scopedWhere,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: leadInclude(),
      }),
      this.prisma.crmLead.count({ where: scopedWhere }),
    ]);

    const countsByStatus = await this.prisma.crmLead.groupBy({
      by: ['status'],
      where: this.accessService.applyManagerScope(
        { status: { in: ['NEW', 'FIRST_LESSON', 'PAID', 'WAITLIST', 'ARCHIVE'] } },
        user,
      ),
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

  async findForTeacher(teacherUserId: string, query: { groupId?: string }) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!teacher) return { items: [], total: 0 };

    const where: CrmLeadWhereInput = {
      teacherId: teacher.id,
      status: { in: ['FIRST_LESSON'] },
    };
    if (query.groupId) where.groupId = query.groupId;

    const items = await this.prisma.crmLead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: leadInclude(),
    });
    const total = await this.prisma.crmLead.count({ where });
    return { items, total };
  }
}
