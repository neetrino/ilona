import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@ilona/database';
import { getCalendarDateInTimezone } from '@ilona/types';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { isQuarterEnd } from './notification-cron.util';
import { loadQuarterFacts } from './parent-report-facts';
import { buildParentReportLetter, type ParentReportLetter } from './parent-report-letter';
import {
  quarterBounds,
  quarterKeyFromDate,
  quarterSendProgress,
  previousQuarterKey,
  recentQuarterKeys,
  studentWasInQuarter,
  type QuarterBounds,
} from './parent-quarter.util';

type ReportStudent = {
  id: string;
  parentName: string | null;
  parentEmail: string | null;
  centerId: string | null;
  user: { firstName: string; lastName: string };
  group: { id: string; name: string; centerId: string } | null;
  parentQuarterlyReports: Array<{ quarterKey: string; sentAt: Date; parentEmail: string }>;
  registerDate?: Date | null;
  enrolledAt?: Date;
  createdAt?: Date;
  groupHistory?: Array<{
    joinedAt: Date;
    leftAt: Date | null;
    group: { id: string; name: string; centerId: string };
  }>;
};

@Injectable()
export class ParentReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async list(quarterKey: string | undefined, user?: JwtPayload) {
    const currentQuarterKey = quarterKeyFromDate(new Date());
    const key = quarterKey ?? currentQuarterKey;
    const centerId = getManagerCenterIdOrThrow(user);
    const past = key !== currentQuarterKey;
    const [students, history] = await Promise.all([
      this.findStudents(centerId, undefined, past ? quarterBounds(key) : undefined),
      this.loadHistory(centerId, currentQuarterKey),
    ]);
    const progress = quarterSendProgress(key, new Date());
    return {
      quarterKey: key,
      currentQuarterKey,
      daysPassed: progress.daysPassed,
      daysLeft: progress.daysLeft,
      history,
      items: students.map((student) => this.toListItem(student, key)),
    };
  }

  async preview(studentId: string, quarterKey: string, user?: JwtPayload): Promise<ParentReportLetter> {
    const student = await this.requireStudent(studentId, user);
    return this.compose(student, quarterKey);
  }

  async sendOne(
    studentId: string,
    quarterKey: string,
    user?: JwtPayload,
    resend = false,
  ): Promise<{ sent: boolean }> {
    const student = await this.requireStudent(studentId, user);
    this.assertSendable(student);
    return { sent: await this.deliver(student, quarterKey, resend) };
  }

  async sendAll(
    quarterKey: string,
    user?: JwtPayload,
    studentIds?: string[],
  ): Promise<{ sent: number; skipped: number }> {
    const centerId = user ? getManagerCenterIdOrThrow(user) : undefined;
    const students = await this.findStudents(centerId);
    const chosen = studentIds
      ? students.filter((student) => studentIds.includes(student.id))
      : students;
    let sent = 0;
    let skipped = 0;
    for (const student of chosen) {
      const delivered = await this.deliver(student, quarterKey);
      if (delivered) {
        sent += 1;
      } else {
        skipped += 1;
      }
    }
    return { sent, skipped };
  }

  async sendDueQuarter(now: Date): Promise<number> {
    if (!isQuarterEnd(getCalendarDateInTimezone(now))) {
      return 0;
    }
    const result = await this.sendAll(quarterKeyFromDate(now));
    return result.sent;
  }

  private async deliver(student: ReportStudent, quarterKey: string, resend = false): Promise<boolean> {
    const alreadySent = student.parentQuarterlyReports.some((report) => report.quarterKey === quarterKey);
    if (!student.parentEmail || (alreadySent && !resend)) {
      return false;
    }
    const letter = await this.compose(student, quarterKey);
    const emailed = await this.email.send({
      to: student.parentEmail,
      subject: letter.subject,
      html: letter.html,
      text: letter.text,
    });
    if (!emailed) {
      return false;
    }
    return this.recordSend(student, quarterKey, alreadySent);
  }

  private async recordSend(student: ReportStudent, quarterKey: string, replace: boolean): Promise<boolean> {
    if (replace) {
      await this.prisma.parentQuarterlyReport.update({
        where: { studentId_quarterKey: { studentId: student.id, quarterKey } },
        data: { sentAt: new Date(), parentEmail: student.parentEmail ?? '' },
      });
      return true;
    }
    try {
      await this.prisma.parentQuarterlyReport.create({
        data: {
          studentId: student.id,
          quarterKey,
          parentEmail: student.parentEmail ?? '',
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }

  private async compose(student: ReportStudent, quarterKey: string): Promise<ParentReportLetter> {
    const bounds = quarterBounds(quarterKey);
    const previousKey = previousQuarterKey(quarterKey);
    const [current, previous] = await Promise.all([
      loadQuarterFacts(this.prisma, student.id, student.group?.id ?? null, bounds),
      loadQuarterFacts(this.prisma, student.id, student.group?.id ?? null, quarterBounds(previousKey)),
    ]);
    return buildParentReportLetter({
      parentName: student.parentName,
      studentName: `${student.user.firstName} ${student.user.lastName}`.trim(),
      quarterKey,
      current,
      previous,
    });
  }

  private async requireStudent(studentId: string, user?: JwtPayload): Promise<ReportStudent> {
    const centerId = getManagerCenterIdOrThrow(user);
    const student = await this.findStudents(centerId, studentId);
    const match = student[0];
    if (!match) {
      throw new NotFoundException('Student not found');
    }
    return match;
  }

  private assertSendable(student: ReportStudent): void {
    if (!student.parentEmail) {
      throw new BadRequestException('Student card has no parent email');
    }
  }

  private async loadHistory(centerId: string | undefined, currentQuarterKey: string) {
    const recent = recentQuarterKeys(currentQuarterKey, 4);
    const rows = await this.prisma.parentQuarterlyReport.groupBy({
      by: ['quarterKey'],
      where: centerId ? { student: { OR: [{ centerId }, { group: { centerId } }] } } : {},
      _count: { _all: true },
    });
    const counts = new Map(rows.map((row) => [row.quarterKey, row._count._all]));
    const older = rows
      .map((row) => row.quarterKey)
      .filter((key) => !recent.includes(key))
      .sort((left, right) => right.localeCompare(left));
    return [...recent, ...older].map((quarterKey) => ({
      quarterKey,
      sent: counts.get(quarterKey) ?? 0,
    }));
  }

  private async findStudents(
    centerId: string | undefined,
    studentId?: string,
    period?: QuarterBounds,
  ): Promise<ReportStudent[]> {
    const rows = await this.prisma.student.findMany({
      where: {
        ...(studentId || period ? {} : { status: 'ACTIVE' as const }),
        ...(studentId ? { id: studentId } : {}),
        ...(centerId ? { OR: centerMatch(centerId, Boolean(period || studentId)) } : {}),
      },
      select: {
        id: true,
        parentName: true,
        parentEmail: true,
        centerId: true,
        registerDate: true,
        enrolledAt: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
        group: { select: { id: true, name: true, centerId: true } },
        groupHistory: {
          select: {
            joinedAt: true,
            leftAt: true,
            group: { select: { id: true, name: true, centerId: true } },
          },
        },
        parentQuarterlyReports: {
          select: { quarterKey: true, sentAt: true, parentEmail: true },
        },
      },
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
    });
    const present = period ? rows.filter((row) => wasPresent(row, period)) : rows;
    return present.map((row) => withQuarterGroup(row, period));
  }

  private toListItem(student: ReportStudent, quarterKey: string) {
    const sent = student.parentQuarterlyReports.find((report) => report.quarterKey === quarterKey);
    return {
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`.trim(),
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      groupId: student.group?.id ?? null,
      groupName: student.group?.name ?? null,
      sentAt: sent?.sentAt.toISOString() ?? null,
      sentQuarters: student.parentQuarterlyReports.map((report) => report.quarterKey),
    };
  }
}

function centerMatch(centerId: string, includeHistory: boolean) {
  const match = [{ centerId }, { group: { centerId } }];
  if (!includeHistory) return match;
  return [...match, { groupHistory: { some: { group: { centerId } } } }];
}

function wasPresent(student: ReportStudent, period: QuarterBounds): boolean {
  return studentWasInQuarter(
    {
      startedAt: student.registerDate ?? student.enrolledAt ?? student.createdAt ?? period.end,
      groupHistory: student.groupHistory ?? [],
    },
    period,
  );
}

function withQuarterGroup(student: ReportStudent, period?: QuarterBounds): ReportStudent {
  if (!period) return student;
  const match = (student.groupHistory ?? [])
    .filter((entry) => entry.joinedAt < period.end && (entry.leftAt == null || entry.leftAt > period.start))
    .sort((left, right) => right.joinedAt.getTime() - left.joinedAt.getTime())[0];
  return match ? { ...student, group: match.group } : student;
}

export function assertManagerCanAccessCenter(
  managerCenterId: string | undefined,
  centers: Array<string | null | undefined>,
): void {
  if (!managerCenterId) {
    return;
  }
  if (!centers.includes(managerCenterId)) {
    throw new ForbiddenException('You do not have access to this record');
  }
}
