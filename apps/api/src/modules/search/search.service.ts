import { Injectable } from '@nestjs/common';
import { UserRole } from '@ilona/database';
import type { Prisma } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { matchQuickPages } from './search-quick-pages';
import { normalizeSearchQuery, searchTokensFromNormalized } from './search-query.util';
import type { GlobalSearchResult } from './types/search-result.type';

const PER_TYPE = 8;
const DEFAULT_MAX = 28;

function userSearchOrSingleToken(token: string): Prisma.UserWhereInput['OR'] {
  return [
    { firstName: { contains: token, mode: 'insensitive' } },
    { lastName: { contains: token, mode: 'insensitive' } },
    { email: { contains: token, mode: 'insensitive' } },
    { phone: { contains: token, mode: 'insensitive' } },
  ];
}

function userWhereMatchesTokens(tokens: string[]): Prisma.UserWhereInput {
  if (tokens.length === 1) {
    return { OR: userSearchOrSingleToken(tokens[0]) };
  }
  return { AND: tokens.map((token) => ({ OR: userSearchOrSingleToken(token) })) };
}

function studentTextOneToken(token: string): Prisma.StudentWhereInput {
  return {
    OR: [
      { user: { OR: userSearchOrSingleToken(token) } },
      { parentPhone: { contains: token, mode: 'insensitive' } },
      { parentEmail: { contains: token, mode: 'insensitive' } },
      { parentName: { contains: token, mode: 'insensitive' } },
    ],
  };
}

function studentTextMatchTokens(tokens: string[]): Prisma.StudentWhereInput {
  if (tokens.length === 1) {
    return studentTextOneToken(tokens[0]);
  }
  return { AND: tokens.map((t) => studentTextOneToken(t)) };
}

function groupNameOrDescriptionMatchTokens(tokens: string[]): Prisma.GroupWhereInput {
  const perToken = (token: string): Prisma.GroupWhereInput => ({
    OR: [
      { name: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

function crmLeadFieldsMatchTokens(tokens: string[]): Prisma.CrmLeadWhereInput {
  const perToken = (token: string): Prisma.CrmLeadWhereInput => ({
    OR: [
      { firstName: { contains: token, mode: 'insensitive' } },
      { lastName: { contains: token, mode: 'insensitive' } },
      { phone: { contains: token, mode: 'insensitive' } },
      { parentPhone: { contains: token, mode: 'insensitive' } },
      { parentName: { contains: token, mode: 'insensitive' } },
      { notes: { contains: token, mode: 'insensitive' } },
      { comment: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

function lessonSearchMatchTokens(tokens: string[]): Prisma.LessonWhereInput {
  const perToken = (token: string): Prisma.LessonWhereInput => ({
    OR: [
      { topic: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
      { notes: { contains: token, mode: 'insensitive' } },
      { group: { name: { contains: token, mode: 'insensitive' } } },
      { teacher: { user: { OR: userSearchOrSingleToken(token) } } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

function paymentSearchClause(normalizedPhrase: string, tokens: string[]): Prisma.PaymentWhereInput {
  return {
    OR: [
      { notes: { contains: normalizedPhrase, mode: 'insensitive' } },
      { transactionId: { contains: normalizedPhrase, mode: 'insensitive' } },
      { paymentMethod: { contains: normalizedPhrase, mode: 'insensitive' } },
      { student: studentTextMatchTokens(tokens) },
    ],
  };
}

function recordingSearchClause(normalizedPhrase: string, tokens: string[]): Prisma.RecordingItemWhereInput {
  const fileOrGroupPerToken = (token: string): Prisma.RecordingItemWhereInput => ({
    OR: [
      { fileName: { contains: token, mode: 'insensitive' } },
      { group: { name: { contains: token, mode: 'insensitive' } } },
    ],
  });
  const multiTokenFileOrGroup: Prisma.RecordingItemWhereInput | null =
    tokens.length > 1 ? { AND: tokens.map(fileOrGroupPerToken) } : null;
  return {
    OR: [
      { fileName: { contains: normalizedPhrase, mode: 'insensitive' } },
      { group: { name: { contains: normalizedPhrase, mode: 'insensitive' } } },
      ...(multiTokenFileOrGroup ? [multiTokenFileOrGroup] : []),
      { student: studentTextMatchTokens(tokens) },
    ],
  };
}

function teacherPipelineLeadMatchTokens(tokens: string[]): Prisma.CrmLeadWhereInput {
  const perToken = (token: string): Prisma.CrmLeadWhereInput => ({
    OR: [
      { firstName: { contains: token, mode: 'insensitive' } },
      { lastName: { contains: token, mode: 'insensitive' } },
      { phone: { contains: token, mode: 'insensitive' } },
      { parentPhone: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

function lessonTopicNotesMatchTokens(tokens: string[]): Prisma.LessonWhereInput {
  const perToken = (token: string): Prisma.LessonWhereInput => ({
    OR: [
      { topic: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
      { notes: { contains: token, mode: 'insensitive' } },
    ],
  });
  if (tokens.length === 1) {
    return perToken(tokens[0]);
  }
  return { AND: tokens.map(perToken) };
}

function studentPortalPaymentMatch(normalizedPhrase: string, tokens: string[]): Prisma.PaymentWhereInput {
  const perToken = (token: string): Prisma.PaymentWhereInput => ({
    OR: [
      { notes: { contains: token, mode: 'insensitive' } },
      { transactionId: { contains: token, mode: 'insensitive' } },
      { paymentMethod: { contains: token, mode: 'insensitive' } },
    ],
  });
  return {
    OR: [
      { notes: { contains: normalizedPhrase, mode: 'insensitive' } },
      { transactionId: { contains: normalizedPhrase, mode: 'insensitive' } },
      { paymentMethod: { contains: normalizedPhrase, mode: 'insensitive' } },
      ...(tokens.length > 1 ? [{ AND: tokens.map(perToken) }] : []),
    ],
  };
}

function studentPortalRecordingMatch(normalizedPhrase: string, tokens: string[]): Prisma.RecordingItemWhereInput {
  const perToken = (token: string): Prisma.RecordingItemWhereInput => ({
    OR: [
      { fileName: { contains: token, mode: 'insensitive' } },
      { group: { name: { contains: token, mode: 'insensitive' } } },
    ],
  });
  return {
    OR: [
      { fileName: { contains: normalizedPhrase, mode: 'insensitive' } },
      { group: { name: { contains: normalizedPhrase, mode: 'insensitive' } } },
      ...(tokens.length > 1 ? [{ AND: tokens.map(perToken) }] : []),
    ],
  };
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(user: JwtPayload, rawQuery: string, limit?: number): Promise<GlobalSearchResult[]> {
    const q = normalizeSearchQuery(rawQuery);
    if (q.length < 2) {
      return [];
    }
    const tokens = searchTokensFromNormalized(q);
    if (tokens.length === 0) {
      return [];
    }

    const maxTotal = Math.min(Math.max(1, limit ?? DEFAULT_MAX), 30);
    const perType = Math.min(PER_TYPE, Math.max(5, Math.ceil(maxTotal / 3)));
    const quickCap = Math.min(8, maxTotal);

    const quick = matchQuickPages(user.role, q, quickCap);

    let entityResults: GlobalSearchResult[] = [];

    if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
      const centerId = getManagerCenterIdOrThrow(user);
      const [students, teachers, groups, leads, lessons, payments, recordings] = await Promise.all([
        this.searchStudentsStaff(tokens, perType, centerId),
        this.searchTeachersStaff(tokens, perType, centerId),
        this.searchGroupsStaff(tokens, perType, centerId),
        this.searchCrmLeadsStaff(tokens, perType, centerId),
        this.searchLessonsStaff(tokens, perType, centerId),
        this.searchPaymentsStaff(tokens, q, perType, centerId),
        this.searchRecordingsStaff(tokens, q, perType, centerId),
      ]);
      entityResults = [...students, ...teachers, ...groups, ...leads, ...lessons, ...payments, ...recordings];
    } else if (user.role === UserRole.TEACHER) {
      entityResults = await this.searchTeacherEntities(user.sub, tokens, perType);
    } else if (user.role === UserRole.STUDENT) {
      entityResults = await this.searchStudentEntities(user.sub, tokens, q, perType);
    }

    const merged = [...quick, ...entityResults];
    const seen = new Set<string>();
    const deduped: GlobalSearchResult[] = [];
    for (const item of merged) {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= maxTotal) break;
    }
    return deduped;
  }

  private async searchStudentsStaff(
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

  private async searchTeachersStaff(
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
                { substituteForGroups: { some: { centerId } } },
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

  private async searchGroupsStaff(
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

  private async searchCrmLeadsStaff(
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

  private async searchLessonsStaff(
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

  private async searchPaymentsStaff(
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

  private async searchRecordingsStaff(
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

  private async searchTeacherEntities(userId: string, tokens: string[], take: number): Promise<GlobalSearchResult[]> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) {
      return [];
    }
    const groupRows = await this.prisma.group.findMany({
      where: {
        isActive: true,
        OR: [{ teacherId: teacher.id }, { substituteTeacherId: teacher.id }],
      },
      select: { id: true },
    });
    const groupIds = groupRows.map((g) => g.id);

    const studentScope: Prisma.StudentWhereInput =
      groupIds.length > 0
        ? { OR: [{ groupId: { in: groupIds } }, { teacherId: teacher.id }] }
        : { teacherId: teacher.id };

    const [students, groups, lessons, leads] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          AND: [studentTextMatchTokens(tokens), studentScope],
        },
        take,
        orderBy: [{ user: { firstName: 'asc' } }],
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          group: { select: { name: true } },
        },
      }),
      groupIds.length
        ? this.prisma.group.findMany({
            where: {
              id: { in: groupIds },
              ...groupNameOrDescriptionMatchTokens(tokens),
            },
            take,
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      this.prisma.lesson.findMany({
        where: {
          teacherId: teacher.id,
          ...lessonSearchMatchTokens(tokens),
        },
        take,
        orderBy: { scheduledAt: 'desc' },
        select: { id: true, topic: true, scheduledAt: true, group: { select: { name: true } } },
      }),
      this.prisma.crmLead.findMany({
        where: {
          teacherId: teacher.id,
          status: { in: ['NEW', 'FIRST_LESSON'] },
          transferFlag: false,
          ...teacherPipelineLeadMatchTokens(tokens),
        },
        take,
        select: { id: true, firstName: true, lastName: true, phone: true },
      }),
    ]);

    const studentResults: GlobalSearchResult[] = students.map((s) => ({
      id: s.id,
      type: 'student' as const,
      title: `${s.user.firstName} ${s.user.lastName}`.trim(),
      subtitle: s.user.email ?? undefined,
      description: s.group?.name ? `Group: ${s.group.name}` : undefined,
      href: `/teacher/students/${s.id}`,
      badge: 'Student',
    }));

    const groupResults: GlobalSearchResult[] = groups.map((g) => ({
      id: g.id,
      type: 'group' as const,
      title: g.name,
      href: `/teacher/schedule`,
      badge: 'Group',
    }));

    const lessonResults: GlobalSearchResult[] = lessons.map((lesson) => ({
      id: lesson.id,
      type: 'lesson' as const,
      title: lesson.topic?.trim() || lesson.group?.name || 'Lesson',
      subtitle: lesson.group?.name,
      description: lesson.scheduledAt.toISOString(),
      href: `/teacher/calendar/${encodeURIComponent(lesson.id)}`,
      badge: 'Lesson',
    }));

    const leadResults: GlobalSearchResult[] = leads.map((lead) => {
      const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
      return {
        id: lead.id,
        type: 'crm_lead' as const,
        title: name || lead.phone || 'Lead',
        subtitle: 'Onboarding',
        href: '/teacher/students',
        badge: 'CRM',
      };
    });

    return [...studentResults, ...groupResults, ...lessonResults, ...leadResults];
  }

  private async searchStudentEntities(
    userId: string,
    tokens: string[],
    normalizedPhrase: string,
    take: number,
  ): Promise<GlobalSearchResult[]> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, groupId: true },
    });
    if (!student) {
      return [];
    }

    const [lessons, payments, recordings] = await Promise.all([
      student.groupId
        ? this.prisma.lesson.findMany({
            where: {
              groupId: student.groupId,
              ...lessonTopicNotesMatchTokens(tokens),
            },
            take,
            orderBy: { scheduledAt: 'desc' },
            select: { id: true, topic: true, scheduledAt: true, group: { select: { name: true } } },
          })
        : Promise.resolve([]),
      this.prisma.payment.findMany({
        where: {
          studentId: student.id,
          ...studentPortalPaymentMatch(normalizedPhrase, tokens),
        },
        take,
        orderBy: { month: 'desc' },
        select: { id: true, month: true, status: true },
      }),
      this.prisma.recordingItem.findMany({
        where: {
          studentId: student.id,
          ...studentPortalRecordingMatch(normalizedPhrase, tokens),
        },
        take,
        orderBy: { recordedAt: 'desc' },
        select: { id: true, fileName: true, group: { select: { name: true } } },
      }),
    ]);

    const lessonResults: GlobalSearchResult[] = lessons.map((lesson) => ({
      id: lesson.id,
      type: 'lesson' as const,
      title: lesson.topic?.trim() || lesson.group?.name || 'Lesson',
      subtitle: lesson.group?.name,
      description: lesson.scheduledAt.toISOString(),
      href: '/student/dashboard',
      badge: 'Lesson',
    }));

    const paymentResults: GlobalSearchResult[] = payments.map((p) => ({
      id: p.id,
      type: 'payment' as const,
      title: `Payment · ${p.status}`,
      subtitle: p.month.toISOString().slice(0, 7),
      href: '/student/payments',
      badge: 'Payment',
    }));

    const recordingResults: GlobalSearchResult[] = recordings.map((r) => ({
      id: r.id,
      type: 'recording' as const,
      title: r.fileName || 'Recording',
      subtitle: r.group?.name ?? undefined,
      href: '/student/recordings',
      badge: 'Recording',
    }));

    return [...lessonResults, ...paymentResults, ...recordingResults];
  }
}
