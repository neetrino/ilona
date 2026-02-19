import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
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
  }) {
    const { groupId, teacherId, weekdays, startTime, endTime, startDate, endDate, topic, description } = params;

    // Calculate duration from time range
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = endMinutes - startMinutes;

    if (duration <= 0) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate group exists and teacher is assigned
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { teacher: true },
    });

    if (!group) {
      throw new BadRequestException(`Group with ID ${groupId} not found`);
    }

    // Check if teacher is assigned to this group
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('You are not assigned to this group');
    }

    // Generate all potential lesson dates
    const lessons: CreateLessonDto[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const endDateWithTime = new Date(endDate);
    endDateWithTime.setHours(23, 59, 59, 999);

    // Cap at 200 lessons to prevent abuse
    const MAX_LESSONS = 200;

    // First, generate all potential lesson dates
    const potentialLessons: Date[] = [];
    while (current <= endDateWithTime) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      if (weekdays.includes(dayOfWeek)) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const scheduledAt = new Date(current);
        scheduledAt.setHours(hours, minutes, 0, 0);

        if (scheduledAt >= startDate && scheduledAt <= endDateWithTime) {
          potentialLessons.push(scheduledAt);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    // Check limit before querying
    if (potentialLessons.length > MAX_LESSONS) {
      throw new BadRequestException(
        `Cannot create more than ${MAX_LESSONS} lessons at once. Please reduce the date range or number of weekdays.`
      );
    }

    // Create lessons from all potential dates (allow duplicates - user can create lessons whenever they want)
    for (const scheduledAt of potentialLessons) {
      lessons.push({
        groupId,
        teacherId,
        scheduledAt: scheduledAt.toISOString(),
        duration,
        topic,
        description,
      });
    }

    if (lessons.length === 0) {
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedWeekdays = weekdays.map(wd => weekdayNames[wd]).join(', ');
      
      throw new BadRequestException(
        `No lessons match the selected weekdays (${selectedWeekdays}) in the date range ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}.`
      );
    }

    return this.crudService.createBulk(lessons);
  }
}



