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
  previousQuarterKey,
} from './parent-quarter.util';

type ReportStudent = {
  id: string;
  parentName: string | null;
  parentEmail: string | null;
  receiveReports: boolean;
  centerId: string | null;
  user: { firstName: string; lastName: string };
  group: { id: string; name: string; centerId: string } | null;
  parentQuarterlyReports: Array<{ sentAt: Date; parentEmail: string }>;
};

@Injectable()
export class ParentReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async list(quarterKey: string | undefined, user?: JwtPayload) {
    const key = quarterKey ?? quarterKeyFromDate(new Date());
    const centerId = getManagerCenterIdOrThrow(user);
    const students = await this.findStudents(key, centerId);
    return {
      quarterKey: key,
      items: students.map((student) => this.toListItem(student)),
    };
  }

  async preview(studentId: string, quarterKey: string, user?: JwtPayload): Promise<ParentReportLetter> {
    const student = await this.requireStudent(studentId, quarterKey, user);
    return this.compose(student, quarterKey);
  }

  async sendOne(studentId: string, quarterKey: string, user?: JwtPayload): Promise<{ sent: boolean }> {
    const student = await this.requireStudent(studentId, quarterKey, user);
    this.assertSendable(student);
    return { sent: await this.deliver(student, quarterKey) };
  }

  async sendAll(quarterKey: string, user?: JwtPayload): Promise<{ sent: number; skipped: number }> {
    const centerId = user ? getManagerCenterIdOrThrow(user) : undefined;
    const students = await this.findStudents(quarterKey, centerId);
    let sent = 0;
    let skipped = 0;
    for (const student of students) {
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

  private async deliver(student: ReportStudent, quarterKey: string): Promise<boolean> {
    if (!student.receiveReports || !student.parentEmail || student.parentQuarterlyReports.length > 0) {
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
    return this.recordSend(student, quarterKey);
  }

  private async recordSend(student: ReportStudent, quarterKey: string): Promise<boolean> {
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

  private async requireStudent(studentId: string, quarterKey: string, user?: JwtPayload): Promise<ReportStudent> {
    const centerId = getManagerCenterIdOrThrow(user);
    const student = await this.findStudents(quarterKey, centerId, studentId);
    const match = student[0];
    if (!match) {
      throw new NotFoundException('Student not found');
    }
    return match;
  }

  private assertSendable(student: ReportStudent): void {
    if (!student.receiveReports) {
      throw new BadRequestException('Parent reports are turned off for this student');
    }
    if (!student.parentEmail) {
      throw new BadRequestException('Student card has no parent email');
    }
  }

  private async findStudents(
    quarterKey: string,
    centerId: string | undefined,
    studentId?: string,
  ): Promise<ReportStudent[]> {
    return this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        ...(studentId ? { id: studentId } : {}),
        ...(centerId
          ? { OR: [{ centerId }, { group: { centerId } }] }
          : {}),
      },
      select: {
        id: true,
        parentName: true,
        parentEmail: true,
        receiveReports: true,
        centerId: true,
        user: { select: { firstName: true, lastName: true } },
        group: { select: { id: true, name: true, centerId: true } },
        parentQuarterlyReports: {
          where: { quarterKey },
          select: { sentAt: true, parentEmail: true },
        },
      },
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
    });
  }

  private toListItem(student: ReportStudent) {
    const sent = student.parentQuarterlyReports[0];
    return {
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`.trim(),
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      groupName: student.group?.name ?? null,
      receiveReports: student.receiveReports,
      sentAt: sent?.sentAt.toISOString() ?? null,
    };
  }
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
