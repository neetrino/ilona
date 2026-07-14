import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  endOfZonedDay,
  enumerateYmdRange,
  toYmd,
  wallTimeToUtc,
  ymdWeekday,
} from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto';
import { LessonCrudService } from './lesson-crud.service';

/**
 * Service responsible for lesson scheduling operations
 */
@Injectable()
export class LessonSchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crudService: LessonCrudService,
  ) {}

  // Schedule helper - create recurring lessons
  async createRecurring(params: {
    groupId: string;
    teacherId: string;
    weekdays: number[]; // Array of 0-6 (Sunday-Saturday)
    startTime: string; // "09:00"
    endTime: string; // "10:30"
    startDate: Date;
    endDate: Date;
    topic?: string;
    description?: string;
  }): Promise<unknown> {
    const { groupId, teacherId, weekdays, startTime, endTime, startDate, endDate, topic, description } =
      params;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const duration = endH * 60 + endM - (startH * 60 + startM);

    if (duration <= 0) {
      throw new BadRequestException('End time must be after start time');
    }

    if (duration < 15 || duration > 240) {
      throw new BadRequestException(
        'Lesson duration must be between 15 and 240 minutes (set a valid time range).',
      );
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { teacher: true },
    });

    if (!group) {
      throw new BadRequestException(`Group with ID ${groupId} not found`);
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You are not assigned to this group');
    }

    const startYmd = toYmd(startDate);
    const endYmd = toYmd(endDate);
    const rangeStart = wallTimeToUtc(startYmd, startTime);
    const rangeEnd = endOfZonedDay(endYmd);

    const potentialLessons: Date[] = [];
    for (const ymd of enumerateYmdRange(startYmd, endYmd)) {
      if (!weekdays.includes(ymdWeekday(ymd))) {
        continue;
      }
      const scheduledAt = wallTimeToUtc(ymd, startTime);
      if (scheduledAt >= rangeStart && scheduledAt <= rangeEnd) {
        potentialLessons.push(scheduledAt);
      }
    }

    const MAX_LESSONS = 200;
    if (potentialLessons.length > MAX_LESSONS) {
      throw new BadRequestException(
        `Cannot create more than ${MAX_LESSONS} lessons at once. Please reduce the date range or number of weekdays.`,
      );
    }

    if (potentialLessons.length === 0) {
      const weekdayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const selectedWeekdays = weekdays.map((wd) => weekdayNames[wd]).join(', ');

      throw new BadRequestException(
        `No lessons match the selected weekdays (${selectedWeekdays}) in the date range ${startYmd} to ${endYmd}.`,
      );
    }

    const alreadyScheduled = await this.prisma.lesson.findMany({
      where: {
        groupId,
        teacherId,
        scheduledAt: { in: potentialLessons },
      },
      select: { scheduledAt: true },
    });
    const existingAt = new Set(alreadyScheduled.map((r) => r.scheduledAt.getTime()));
    const newSlots = potentialLessons.filter((d) => !existingAt.has(d.getTime()));
    const skippedDuplicateCount = potentialLessons.length - newSlots.length;

    if (newSlots.length === 0) {
      throw new BadRequestException(
        skippedDuplicateCount > 0
          ? 'All selected time slots already have lessons for this group and teacher. No new lessons were created.'
          : 'No new lessons to create in this range.',
      );
    }

    const lessons: CreateLessonDto[] = newSlots.map((scheduledAt) => ({
      groupId,
      teacherId,
      scheduledAt: scheduledAt.toISOString(),
      duration,
      topic,
      description,
    }));

    const created = await this.crudService.createBulk(lessons);
    return { items: created, skippedDuplicateCount };
  }
}
