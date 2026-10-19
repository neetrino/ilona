import { Injectable } from '@nestjs/common';
import { getZonedParts } from '@ilona/types';
import { NotificationCronDutiesService } from './notification-cron-duties.service';
import { NotificationCronFinanceService } from './notification-cron-finance.service';
import { NotificationCronStudentsService } from './notification-cron-students.service';
import { ParentReportService } from './parent-report.service';

@Injectable()
export class NotificationCronService {
  constructor(
    private readonly duties: NotificationCronDutiesService,
    private readonly finance: NotificationCronFinanceService,
    private readonly students: NotificationCronStudentsService,
    private readonly parentReports: ParentReportService,
  ) {}

  async runTick(now = new Date(), options?: { force?: boolean }): Promise<Record<string, number>> {
    const force = Boolean(options?.force);
    const hour = getZonedParts(now).hour;
    const dailyBranch =
      force || hour >= 11 ? await this.duties.sendDailyBranchReports(now) : 0;
    const missedDeadline = await this.duties.sendMissedDeadlines(now);
    const overdue = await this.finance.sendOverduePayments(now);
    const quarterly = await this.finance.sendQuarterlyReminders(now, { force });
    const late = await this.students.sendFrequentLateAlerts(now);
    const recordings =
      force || hour >= 21 ? await this.students.sendMissingRecordingReminders(now) : 0;
    const churn = await this.students.sendChurnAlerts(now);
    const parentReports = await this.parentReports.sendDueQuarter(now);
    return {
      dailyBranch,
      missedDeadline,
      overdue,
      quarterly,
      late,
      recordings,
      churn,
      parentReports,
    };
  }
}
