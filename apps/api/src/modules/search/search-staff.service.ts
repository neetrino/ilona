import { Injectable } from '@nestjs/common';
import type { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import type { GlobalSearchResult } from './types/search-result.type';
import {
  crmLeadFieldsMatchTokens,
  groupNameOrDescriptionMatchTokens,
  lessonSearchMatchTokens,
  paymentSearchClause,
  recordingSearchClause,
  studentTextMatchTokens,
  userWhereMatchesTokens,
} from './search-filter.util';

@Injectable()
export class SearchStaffService {
  constructor(private readonly prisma: PrismaService) {}

  async searchStudentsStaff(
    tokens: string[],
    take: number,
    centerId: string | undefined,
  ): Promise<GlobalSearchResult[]> {
    const where: Prisma.StudentWhereInput = {
      AND: [studentTextMatchTokens(tokens), ...(centerId ? [{ group: { centerId } } as Prisma.StudentWhereInput] : [])],
    };
    const rows = await this.prisma.student.findMany({
      where,
      take,
      orderBy: [{ user: { firstName: 'asc' } }],
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        group: { select: { name: true } },
      },
    });
    return rows.map((s) => ({
      id: s.id,
      type: 'student' as const,
      title: `${s.user.firstName} ${s.user.lastName}`.trim(),
      subtitle: s.user.email ?? undefined,
      description: s.group?.name ? `Group: ${s.group.name}` : undefined,
      href: `/admin/students/${s.id}`,
      badge: 'Student',
    }));
  }

  async searchTeachersStaff(
    tokens: string[],
    take: number,
    centerId: string | undefined,
  ): Promise<GlobalSearchResult[]> {
    const userMatch: Prisma.TeacherWhereInput = {
      user: userWhereMatchesTokens(tokens),
    };
    const where: Prisma.TeacherWhereInput = centerId
      ? {
          AND: [
            userMatch,
            {
              OR: [
                { centerLinks: { some: { centerId } } },
                { groups: { some: { centerId } } },
                { secondTeacherForGroups: { some: { centerId } } },
              ],
            },
          ],
        }
      : userMatch;
    const rows = await this.prisma.teacher.findMany({
      where,
      take,
      orderBy: [{ user: { firstName: 'asc' } }],
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return rows.map((t) => ({
      id: t.id,
      type: 'teacher' as const,
      title: `${t.user.firstName} ${t.user.lastName}`.trim(),
      subtitle: t.user.email ?? undefined,
      href: `/admin/teachers/${t.id}`,
      badge: 'Teacher',
    }));
  }

  async searchGroupsStaff(
    tokens: string[],
    take: number,
    centerId: string | undefined,
  ): Promise<GlobalSearchResult[]> {
    const where: Prisma.GroupWhereInput = {
      ...groupNameOrDescriptionMatchTokens(tokens),
      ...(centerId ? { centerId } : {}),
    };
    const rows = await this.prisma.group.findMany({
      where,
      take,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, center: { select: { name: true } } },
    });
    return rows.map((g) => ({
      id: g.id,
      type: 'group' as const,
      title: g.name,
      subtitle: g.center?.name ?? undefined,
      href: `/admin/groups?editGroup=${encodeURIComponent(g.id)}`,
      badge: 'Group',
    }));
  }

  async searchCrmLeadsStaff(
    tokens: string[],
    take: number,
    centerId: string | undefined,
  ): Promise<GlobalSearchResult[]> {
    const where: Prisma.CrmLeadWhereInput = {
      AND: [crmLeadFieldsMatchTokens(tokens), ...(centerId ? [{ centerId } as Prisma.CrmLeadWhereInput] : [])],
    };
    const rows = await this.prisma.crmLead.findMany({
      where,
      take,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, phone: true, status: true },
    });
    return rows.map((lead) => {
      const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
      const title = name || lead.phone || 'Lead';
      return {
        id: lead.id,
        type: 'crm_lead' as const,
        title,
        subtitle: lead.phone ?? undefined,
        href: `/admin/crm?editLead=${encodeURIComponent(lead.id)}`,
        badge: 'CRM',
        metadata: { status: String(lead.status) },
      };
    });
  }

  async searchLessonsStaff(
    tokens: string[],
    take: number,
    centerId: string | undefined,
  ): Promise<GlobalSearchResult[]> {
    const where: Prisma.LessonWhereInput = {
      AND: [
        lessonSearchMatchTokens(tokens),
        ...(centerId ? [{ group: { centerId } } as Prisma.LessonWhereInput] : []),
      ],
    };
    const rows = await this.prisma.lesson.findMany({
      where,
      take,
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true,
        topic: true,
        scheduledAt: true,
        group: { select: { name: true } },
      },
    });
    return rows.map((lesson) => ({
      id: lesson.id,
      type: 'lesson' as const,
      title: lesson.topic?.trim() || lesson.group?.name || 'Lesson',
      subtitle: lesson.group?.name,
      description: lesson.scheduledAt.toISOString(),
      href: `/admin/calendar/${encodeURIComponent(lesson.id)}`,
      badge: 'Lesson',
    }));
  }

  async searchPaymentsStaff(
    tokens: string[],
    normalizedPhrase: string,
    take: number,
    centerId: string | undefined,
  ): Promise<GlobalSearchResult[]> {
    const where: Prisma.PaymentWhereInput = {
      AND: [
        paymentSearchClause(normalizedPhrase, tokens),
        ...(centerId
          ? [
              {
                student: {
                  group: { centerId },
                },
              } as Prisma.PaymentWhereInput,
            ]
          : []),
      ],
    };
    const rows = await this.prisma.payment.findMany({
      where,
      take,
      orderBy: { dueDate: 'desc' },
      select: {
        id: true,
        month: true,
        status: true,
        student: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      type: 'payment' as const,
      title: `${p.student.user.firstName} ${p.student.user.lastName}`.trim(),
      subtitle: `Payment · ${p.status}`,
      href: `/admin/finance?q=${encodeURIComponent(normalizedPhrase)}`,
      badge: 'Payment',
      metadata: { studentId: p.student.id, month: p.month.toISOString() },
    }));
  }

  async searchRecordingsStaff(
    tokens: string[],
    normalizedPhrase: string,
    take: number,
    centerId: string | undefined,
  ): Promise<GlobalSearchResult[]> {
    const where: Prisma.RecordingItemWhereInput = {
      AND: [
        recordingSearchClause(normalizedPhrase, tokens),
        ...(centerId ? [{ group: { centerId } } as Prisma.RecordingItemWhereInput] : []),
      ],
    };
    const rows = await this.prisma.recordingItem.findMany({
      where,
      take,
      orderBy: { recordedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        recordedAt: true,
        student: { select: { user: { select: { firstName: true, lastName: true } } } },
        group: { select: { name: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      type: 'recording' as const,
      title: r.fileName || 'Recording',
      subtitle: `${r.student.user.firstName} ${r.student.user.lastName}`.trim(),
      description: r.group?.name ?? undefined,
      href: '/admin/recording',
      badge: 'Recording',
    }));
  }
}
