import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { LessonCreationSource, LessonStatus, Prisma } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  type GroupCalendarStored,
  type GroupWeeklySlot,
  buildScheduleJson,
  computeGenerationKey,
  parseGroupSchedulePayload,
} from '../groups/group-schedule-payload';
import { resolveRotatingTeacherId } from '../groups/group-teacher-rotation';

const MAX_OCCURRENCES = 200;

function parseYmd(ymd: string): Date {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Invalid calendar date: ${ymd}`);
  }
  return d;
}

function endOfDayFromYmd(ymd: string): Date {
  const d = parseYmd(ymd);
  d.setHours(23, 59, 59, 999);
  return d;
}

function slotDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function enumerateOccurrences(
  weeklySlots: GroupWeeklySlot[],
  dateFromYmd: string,
  dateToYmd: string,
): Array<{ at: Date; duration: number; slot: GroupWeeklySlot }> {
  const startDay = parseYmd(dateFromYmd);
  startDay.setHours(0, 0, 0, 0);
  const endBoundary = endOfDayFromYmd(dateToYmd);
  const out: Array<{ at: Date; duration: number; slot: GroupWeeklySlot }> = [];
  const cur = new Date(startDay);
  while (cur <= endBoundary) {
    const dow = cur.getDay();
    for (const slot of weeklySlots) {
      if (slot.dayOfWeek !== dow) continue;
      const dur = slotDurationMinutes(slot.startTime, slot.endTime);
      if (dur <= 0) {
        throw new BadRequestException('End time must be after start time for each weekly slot');
      }
      if (dur < 15 || dur > 240) {
        throw new BadRequestException('Each slot must be between 15 and 240 minutes');
      }
      const [h, m] = slot.startTime.split(':').map(Number);
      const at = new Date(cur);
      at.setHours(h, m, 0, 0);
      if (at >= startDay && at <= endBoundary) {
        out.push({ at, duration: dur, slot });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out;
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function minDate(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

@Injectable()
export class GroupScheduleLessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordSuppressedSlotAfterLessonDeletion(params: {
    groupId: string;
    scheduledAt: Date;
    creationSource: LessonCreationSource;
  }): Promise<void> {
    if (params.creationSource !== LessonCreationSource.GROUP_SCHEDULE) {
      return;
    }
    const group = await this.prisma.group.findUnique({
      where: { id: params.groupId },
      select: { schedule: true },
    });
    if (!group?.schedule) return;
    const parsed = parseGroupSchedulePayload(group.schedule);
    if (!parsed.calendar) return;
    const iso = params.scheduledAt.toISOString();
    const suppressed = [...new Set([...(parsed.calendar.suppressedSlotStarts ?? []), iso])];
    const weekly = parsed.weeklySlots.length > 0 ? parsed.weeklySlots : [];
    const calendar: GroupCalendarStored = { ...parsed.calendar, suppressedSlotStarts: suppressed };
    const json = buildScheduleJson(weekly, calendar);
    if (json === undefined) return;
    await this.prisma.group.update({
      where: { id: params.groupId },
      data: { schedule: json },
    });
  }

  /**
   * Creates/updates GROUP_SCHEDULE lessons from weekly slots + calendar range.
   * Assigns teachers via alternating weekly rotation between the two group teachers.
   */
  async syncAfterGroupSaved(params: {
    groupId: string;
    teacherId: string | null | undefined;
    secondTeacherId: string | null | undefined;
    secondTeacherStartsFirstWeek: boolean;
    weeklySlots: GroupWeeklySlot[];
    calendar: GroupCalendarStored | null;
    previousScheduleJson: unknown;
    previousTeacherId: string | null;
    previousSecondTeacherId: string | null;
    previousSecondTeacherStartsFirstWeek: boolean | null;
    confirmReplaceGeneratedLessons: boolean;
  }): Promise<Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined> {
    const teacherId = params.teacherId ?? null;
    const secondTeacherId = params.secondTeacherId ?? null;
    const prev = parseGroupSchedulePayload(params.previousScheduleJson);

    if (
      !teacherId ||
      !secondTeacherId ||
      params.weeklySlots.length === 0 ||
      !params.calendar ||
      !params.calendar.dateFrom ||
      !params.calendar.dateTo
    ) {
      return buildScheduleJson(params.weeklySlots, params.calendar);
    }

    const dateFrom = params.calendar.dateFrom;
    const dateTo = params.calendar.dateTo;
    const fromD = parseYmd(dateFrom);
    const toD = parseYmd(dateTo);
    if (toD < fromD) {
      throw new BadRequestException('Calendar end date must be on or after start date');
    }

    const newKey = computeGenerationKey(
      teacherId,
      secondTeacherId,
      params.weeklySlots,
      dateFrom,
      dateTo,
      params.secondTeacherStartsFirstWeek,
    );
    const oldKey = prev.calendar?.generationKey ?? null;

    const teachersChanged =
      oldKey !== null &&
      params.previousTeacherId != null &&
      params.previousSecondTeacherId != null &&
      (teacherId !== params.previousTeacherId ||
        secondTeacherId !== params.previousSecondTeacherId ||
        params.secondTeacherStartsFirstWeek !==
          (params.previousSecondTeacherStartsFirstWeek ?? false));

    const needsReplace = oldKey !== null && (newKey !== oldKey || teachersChanged);

    if (needsReplace && !params.confirmReplaceGeneratedLessons) {
      throw new ConflictException('GROUP_SCHEDULE_REGENERATION_CONFIRMATION_REQUIRED');
    }

    const occurrences = enumerateOccurrences(params.weeklySlots, dateFrom, dateTo);
    if (occurrences.length > MAX_OCCURRENCES) {
      throw new BadRequestException(
        `Cannot generate more than ${MAX_OCCURRENCES} lessons at once. Narrow the date range or weekdays.`,
      );
    }
    if (occurrences.length === 0) {
      throw new BadRequestException('No lessons match the selected weekdays in this date range.');
    }

    const rangeStart = parseYmd(dateFrom);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = endOfDayFromYmd(dateTo);

    const replaceMode = oldKey === null || needsReplace;

    let suppressed = new Set(params.calendar.suppressedSlotStarts ?? []);
    if (needsReplace && params.confirmReplaceGeneratedLessons) {
      suppressed = new Set();
    }

    let deleteStart = rangeStart;
    let deleteEnd = rangeEnd;
    if (replaceMode && prev.calendar) {
      const prevStart = parseYmd(prev.calendar.dateFrom);
      prevStart.setHours(0, 0, 0, 0);
      const prevEnd = endOfDayFromYmd(prev.calendar.dateTo);
      deleteStart = minDate(rangeStart, prevStart);
      deleteEnd = maxDate(rangeEnd, prevEnd);
    }

    if (replaceMode) {
      await this.prisma.lesson.deleteMany({
        where: {
          groupId: params.groupId,
          creationSource: LessonCreationSource.GROUP_SCHEDULE,
          scheduledAt: { gte: deleteStart, lte: deleteEnd },
        },
      });
    }

    const existingSameGroup = await this.prisma.lesson.findMany({
      where: {
        groupId: params.groupId,
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        status: { not: LessonStatus.CANCELLED },
      },
      select: { scheduledAt: true, duration: true },
    });
    const existingGroupTimes = new Set(existingSameGroup.map((l) => l.scheduledAt.getTime()));

    const teacherBusy = await this.prisma.lesson.findMany({
      where: {
        teacherId: { in: [teacherId, secondTeacherId] },
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        status: { not: LessonStatus.CANCELLED },
        NOT: { groupId: params.groupId },
      },
      select: { teacherId: true, scheduledAt: true, duration: true },
    });

    const toCreate: Prisma.LessonCreateManyInput[] = [];

    for (const { at, duration, slot } of occurrences) {
      const iso = at.toISOString();
      if (suppressed.has(iso)) continue;
      if (existingGroupTimes.has(at.getTime())) continue;

      const assignedTeacherId = resolveRotatingTeacherId({
        lessonDate: at,
        teacherId,
        secondTeacherId,
        scheduleStartDateYmd: dateFrom,
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
        throw new BadRequestException(
          `Teacher already has another lesson overlapping ${at.toISOString()}. Adjust the schedule or resolve conflicts in the calendar.`,
        );
      }

      toCreate.push({
        groupId: params.groupId,
        teacherId: assignedTeacherId,
        scheduledAt: at,
        duration,
        topic: params.calendar.topic ?? null,
        description: params.calendar.description ?? slot.notes ?? null,
        status: LessonStatus.SCHEDULED,
        creationSource: LessonCreationSource.GROUP_SCHEDULE,
      });
    }

    if (toCreate.length > 0) {
      await this.prisma.lesson.createMany({ data: toCreate });
    }

    if (!replaceMode && oldKey === newKey && !teachersChanged) {
      const data: Prisma.LessonUpdateManyMutationInput = {};
      if (params.calendar.topic !== undefined) {
        data.topic = params.calendar.topic;
      }
      if (params.calendar.description !== undefined) {
        data.description = params.calendar.description;
      }
      if (Object.keys(data).length > 0) {
        await this.prisma.lesson.updateMany({
          where: {
            groupId: params.groupId,
            creationSource: LessonCreationSource.GROUP_SCHEDULE,
            scheduledAt: { gte: rangeStart, lte: rangeEnd },
          },
          data,
        });
      }
    }

    const storedCalendar: GroupCalendarStored = {
      ...params.calendar,
      generationKey: newKey,
      suppressedSlotStarts: [...suppressed],
    };

    return buildScheduleJson(params.weeklySlots, storedCalendar);
  }
}
