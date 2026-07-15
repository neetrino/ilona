import { Injectable, Logger } from '@nestjs/common';
import { LessonCreationSource, LessonStatus, Prisma } from '@ilona/database';
import { endOfZonedDay, startOfZonedDay } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  type GroupCalendarStored,
  type GroupWeeklySlot,
  buildScheduleJson,
  computeGenerationKey,
  parseGroupSchedulePayload,
} from '../groups/group-schedule-payload';
import {
  GROUP_SCHEDULE_EXTEND_LEAD_DAYS,
  dayAfterYmd,
  daysUntilYmd,
  scheduleHorizonFromStart,
} from '../groups/group-schedule-rolling';
import { resolveRotatingTeacherId } from '../groups/group-teacher-rotation';
import {
  assertValidYmd,
  assertOccurrenceBatchSize,
  enumerateOccurrences,
  intervalsOverlap,
} from './group-schedule-lessons.util';

export type ExtendRollingSchedulesResult = {
  scanned: number;
  extended: number;
  skipped: number;
  failed: number;
  details: Array<{ groupId: string; status: 'extended' | 'skipped' | 'failed'; reason?: string }>;
};

/**
 * Appends the next 90-day lesson window for rolling group calendars
 * without deleting past GROUP_SCHEDULE lessons.
 */
@Injectable()
export class GroupScheduleRollingService {
  private readonly logger = new Logger(GroupScheduleRollingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async extendAllRollingWindows(now: Date = new Date()): Promise<ExtendRollingSchedulesResult> {
    const groups = await this.prisma.group.findMany({
      where: {
        isActive: true,
        teacherId: { not: null },
        secondTeacherId: { not: null },
      },
      select: {
        id: true,
        teacherId: true,
        secondTeacherId: true,
        secondTeacherStartsFirstWeek: true,
        schedule: true,
      },
    });

    const result: ExtendRollingSchedulesResult = {
      scanned: groups.length,
      extended: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    for (const group of groups) {
      try {
        const outcome = await this.extendOneGroup(group, now);
        result.details.push({ groupId: group.id, ...outcome });
        if (outcome.status === 'extended') result.extended += 1;
        else if (outcome.status === 'skipped') result.skipped += 1;
        else result.failed += 1;
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to extend schedule for group ${group.id}: ${reason}`);
        result.failed += 1;
        result.details.push({ groupId: group.id, status: 'failed', reason });
      }
    }

    return result;
  }

  private async extendOneGroup(
    group: {
      id: string;
      teacherId: string | null;
      secondTeacherId: string | null;
      secondTeacherStartsFirstWeek: boolean;
      schedule: unknown;
    },
    now: Date,
  ): Promise<{ status: 'extended' | 'skipped' | 'failed'; reason?: string }> {
    const teacherId = group.teacherId;
    const secondTeacherId = group.secondTeacherId;
    if (!teacherId || !secondTeacherId) {
      return { status: 'skipped', reason: 'missing_teachers' };
    }

    const parsed = parseGroupSchedulePayload(group.schedule);
    const calendar = parsed.calendar;
    if (!calendar?.dateFrom || !calendar.dateTo || parsed.weeklySlots.length === 0) {
      return { status: 'skipped', reason: 'no_calendar' };
    }
    if (calendar.rolling === false) {
      return { status: 'skipped', reason: 'not_rolling' };
    }

    assertValidYmd(calendar.dateFrom);
    assertValidYmd(calendar.dateTo);

    const remaining = daysUntilYmd(calendar.dateTo, now);
    if (remaining > GROUP_SCHEDULE_EXTEND_LEAD_DAYS) {
      return { status: 'skipped', reason: `horizon_ok_${remaining}d` };
    }

    const windowStart = dayAfterYmd(calendar.dateTo);
    // Next 90 days after current horizon end (inclusive end = dateTo + 90).
    const windowEnd = scheduleHorizonFromStart(calendar.dateTo);

    return this.appendWindow({
      groupId: group.id,
      teacherId,
      secondTeacherId,
      secondTeacherStartsFirstWeek: group.secondTeacherStartsFirstWeek,
      weeklySlots: parsed.weeklySlots,
      calendar,
      windowStart,
      windowEnd,
    });
  }

  private async appendWindow(params: {
    groupId: string;
    teacherId: string;
    secondTeacherId: string;
    secondTeacherStartsFirstWeek: boolean;
    weeklySlots: GroupWeeklySlot[];
    calendar: GroupCalendarStored;
    windowStart: string;
    windowEnd: string;
  }): Promise<{ status: 'extended' | 'skipped' | 'failed'; reason?: string }> {
    const { groupId, teacherId, secondTeacherId, weeklySlots, calendar, windowStart, windowEnd } =
      params;

    if (windowEnd < windowStart) {
      return { status: 'skipped', reason: 'invalid_window' };
    }

    const lessonIndexOffset = await this.prisma.lesson.count({
      where: {
        groupId,
        creationSource: LessonCreationSource.GROUP_SCHEDULE,
        scheduledAt: { lte: endOfZonedDay(calendar.dateTo) },
      },
    });
    const newOccurrences = enumerateOccurrences(weeklySlots, windowStart, windowEnd);
    assertOccurrenceBatchSize(newOccurrences.length);

    if (newOccurrences.length === 0) {
      await this.persistExtendedCalendar({
        groupId,
        weeklySlots,
        calendar,
        teacherId,
        secondTeacherId,
        secondTeacherStartsFirstWeek: params.secondTeacherStartsFirstWeek,
        newDateTo: windowEnd,
      });
      return { status: 'extended', reason: 'horizon_advanced_no_lessons' };
    }

    const rangeStart = startOfZonedDay(windowStart);
    const rangeEnd = endOfZonedDay(windowEnd);

    const existingSameGroup = await this.prisma.lesson.findMany({
      where: {
        groupId,
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        status: { not: LessonStatus.CANCELLED },
      },
      select: { scheduledAt: true },
    });
    const existingGroupTimes = new Set(existingSameGroup.map((l) => l.scheduledAt.getTime()));

    const teacherBusy = await this.prisma.lesson.findMany({
      where: {
        teacherId: { in: [teacherId, secondTeacherId] },
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        status: { not: LessonStatus.CANCELLED },
        NOT: { groupId },
      },
      select: { teacherId: true, scheduledAt: true, duration: true },
    });

    const suppressed = new Set(calendar.suppressedSlotStarts ?? []);
    const toCreate: Prisma.LessonCreateManyInput[] = [];

    for (let i = 0; i < newOccurrences.length; i++) {
      const { at, duration, slot } = newOccurrences[i];
      const iso = at.toISOString();
      if (suppressed.has(iso)) continue;
      if (existingGroupTimes.has(at.getTime())) continue;

      const assignedTeacherId = resolveRotatingTeacherId({
        lessonIndex: lessonIndexOffset + i,
        teacherId,
        secondTeacherId,
        secondTeacherStartsFirstWeek: params.secondTeacherStartsFirstWeek,
      });

      const endAt = new Date(at.getTime() + duration * 60_000);
      const conflict = teacherBusy.some(
        (row) =>
          row.teacherId === assignedTeacherId &&
          intervalsOverlap(
            at,
            endAt,
            row.scheduledAt,
            new Date(row.scheduledAt.getTime() + row.duration * 60_000),
          ),
      );
      if (conflict) {
        this.logger.warn(`Skip overlapping lesson for group ${groupId} at ${iso}`);
        continue;
      }

      toCreate.push({
        groupId,
        teacherId: assignedTeacherId,
        scheduledAt: at,
        duration,
        topic: calendar.topic ?? null,
        description: calendar.description ?? slot.notes ?? null,
        status: LessonStatus.SCHEDULED,
        creationSource: LessonCreationSource.GROUP_SCHEDULE,
      });
    }

    if (toCreate.length > 0) {
      await this.prisma.lesson.createMany({ data: toCreate });
    }

    await this.persistExtendedCalendar({
      groupId,
      weeklySlots,
      calendar,
      teacherId,
      secondTeacherId,
      secondTeacherStartsFirstWeek: params.secondTeacherStartsFirstWeek,
      newDateTo: windowEnd,
    });

    return {
      status: 'extended',
      reason: `created_${toCreate.length}_through_${windowEnd}`,
    };
  }

  private async persistExtendedCalendar(params: {
    groupId: string;
    weeklySlots: GroupWeeklySlot[];
    calendar: GroupCalendarStored;
    teacherId: string;
    secondTeacherId: string;
    secondTeacherStartsFirstWeek: boolean;
    newDateTo: string;
  }): Promise<void> {
    const nextCalendar: GroupCalendarStored = {
      ...params.calendar,
      dateTo: params.newDateTo,
      rolling: true,
      generationKey: computeGenerationKey(
        params.teacherId,
        params.secondTeacherId,
        params.weeklySlots,
        params.calendar.dateFrom,
        params.newDateTo,
        params.secondTeacherStartsFirstWeek,
      ),
    };
    const json = buildScheduleJson(params.weeklySlots, nextCalendar);
    if (json === undefined) return;
    await this.prisma.group.update({
      where: { id: params.groupId },
      data: { schedule: json },
    });
  }
}
