import { Injectable } from '@nestjs/common';
import type { Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import type { GlobalSearchResult } from './types/search-result.type';
import {
  groupNameOrDescriptionMatchTokens,
  lessonSearchMatchTokens,
  lessonTopicNotesMatchTokens,
  studentPortalPaymentMatch,
  studentPortalRecordingMatch,
  studentTextMatchTokens,
  teacherPipelineLeadMatchTokens,
} from './search-filter.util';

@Injectable()
export class SearchRoleQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async searchTeacherEntities(userId: string, tokens: string[], take: number): Promise<GlobalSearchResult[]> {
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
        OR: [{ teacherId: teacher.id }, { secondTeacherId: teacher.id }],
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
      href: `/teacher/daily-duties/${encodeURIComponent(lesson.id)}`,
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

  async searchStudentEntities(
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
