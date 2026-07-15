import { BadRequestException, Injectable } from '@nestjs/common';
import { LessonCreationSource, LessonStatus, Prisma } from '@ilona/database';
import { endOfZonedDay, startOfZonedDay, toYmd } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  type GroupCalendarStored,
  type GroupWeeklySlot,
  buildScheduleJson,
  computeGenerationKey,
  parseGroupSchedulePayload,
} from '../groups/group-schedule-payload';
import { resolveRotatingTeacherId } from '../groups/group-teacher-rotation';
import {
  assertValidYmd,
  assertOccurrenceBatchSize,
  enumerateOccurrences,
  intervalsOverlap,
  maxDate,
  minDate,
} from './group-schedule-lessons.util';

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
   * Assigns teachers via lesson-by-lesson rotation between the two group teachers.
   * Rolling calendars keep past lessons on replace (regen from today forward).
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
  }): Promise<Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined> {
    const teacherId = params.teacherId ?? null;
    const secondTeacherId = params.secondTeacherId ?? null;
    const prev = parseGroupSchedulePayload(params.previousScheduleJson);

    const calendarWithRolling =
      params.calendar == null
        ? null
        : {
            ...params.calendar,
            rolling: params.calendar.rolling !== false,
          };

    if (
      !teacherId ||
      !secondTeacherId ||
      params.weeklySlots.length === 0 ||
      !calendarWithRolling ||
      !calendarWithRolling.dateFrom ||
      !calendarWithRolling.dateTo
    ) {
      return buildScheduleJson(params.weeklySlots, calendarWithRolling);
    }

    const dateFrom = calendarWithRolling.dateFrom;
    const dateTo = calendarWithRolling.dateTo;
    assertValidYmd(dateFrom);
    assertValidYmd(dateTo);
    if (dateTo < dateFrom) {
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

    const isRolling = calendarWithRolling.rolling !== false;
    const todayYmd = toYmd(new Date());
    const regenFromYmd =
      needsReplace && isRolling && todayYmd > dateFrom ? todayYmd : dateFrom;

    const occurrences = enumerateOccurrences(params.weeklySlots, regenFromYmd, dateTo);
    assertOccurrenceBatchSize(occurrences.length);
    if (occurrences.length === 0) {
      throw new BadRequestException('No lessons match the selected weekdays in this date range.');
    }

    const rangeStart = startOfZonedDay(regenFromYmd);
    const rangeEnd = endOfZonedDay(dateTo);
    const replaceMode = oldKey === null || needsReplace;

    let suppressed = new Set(calendarWithRolling.suppressedSlotStarts ?? []);
    if (needsReplace) {
      suppressed = new Set(
        [...suppressed].filter((iso) => {
          const t = Date.parse(iso);
          return !Number.isNaN(t) && t < rangeStart.getTime();
        }),
      );
    }

    let deleteStart = rangeStart;
    let deleteEnd = rangeEnd;
    if (replaceMode && prev.calendar) {
      const prevStart = startOfZonedDay(
        isRolling && todayYmd > prev.calendar.dateFrom ? todayYmd : prev.calendar.dateFrom,
      );
      const prevEnd = endOfZonedDay(prev.calendar.dateTo);
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

    const lessonIndexOffset =
      regenFromYmd > dateFrom
        ? await this.prisma.lesson.count({
            where: {
              groupId: params.groupId,
              creationSource: LessonCreationSource.GROUP_SCHEDULE,
              scheduledAt: { lt: rangeStart },
            },
          })
        : 0;

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

    for (let lessonIndex = 0; lessonIndex < occurrences.length; lessonIndex++) {
      const { at, duration, slot } = occurrences[lessonIndex];
      const iso = at.toISOString();
      if (suppressed.has(iso)) continue;
      if (existingGroupTimes.has(at.getTime())) continue;

      const assignedTeacherId = resolveRotatingTeacherId({
        lessonIndex: lessonIndexOffset + lessonIndex,
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
        throw new BadRequestException(
          `Teacher already has another lesson overlapping ${at.toISOString()}. Adjust the schedule or resolve conflicts in the calendar.`,
        );
      }

      toCreate.push({
        groupId: params.groupId,
        teacherId: assignedTeacherId,
        scheduledAt: at,
        duration,
        topic: calendarWithRolling.topic ?? null,
        description: calendarWithRolling.description ?? slot.notes ?? null,
        status: LessonStatus.SCHEDULED,
        creationSource: LessonCreationSource.GROUP_SCHEDULE,
      });
    }

    if (toCreate.length > 0) {
      await this.prisma.lesson.createMany({ data: toCreate });
    }

    if (!replaceMode && oldKey === newKey && !teachersChanged) {
      const data: Prisma.LessonUpdateManyMutationInput = {};
      if (calendarWithRolling.topic !== undefined) {
        data.topic = calendarWithRolling.topic;
      }
      if (calendarWithRolling.description !== undefined) {
        data.description = calendarWithRolling.description;
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
      ...calendarWithRolling,
      rolling: true,
      generationKey: newKey,
      suppressedSlotStarts: [...suppressed],
    };

    return buildScheduleJson(params.weeklySlots, storedCalendar);
  }
}
