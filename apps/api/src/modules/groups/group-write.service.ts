import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';
import { Prisma } from '@ilona/database';
import { GroupScheduleLessonsService } from '../lessons/group-schedule-lessons.service';
import {
  buildScheduleJson,
  parseGroupSchedulePayload,
  type GroupCalendarStored,
  type GroupWeeklySlot,
} from './group-schedule-payload';
import { FIXED_GROUP_MAX_STUDENTS } from './group.constants';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';
import { GroupAccessService } from './group-access.service';
import { GroupTeacherValidationService } from './group-teacher-validation.service';
import { GroupChatSyncService } from './group-chat-sync.service';
import { GroupQueryService } from './group-query.service';
import { groupWriteInclude } from './group-query-includes';

@Injectable()
export class GroupWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: GroupAccessService,
    private readonly teacherValidation: GroupTeacherValidationService,
    private readonly chatSync: GroupChatSyncService,
    private readonly queryService: GroupQueryService,
    private readonly groupScheduleLessonsService: GroupScheduleLessonsService,
  ) {}

  async create(dto: CreateGroupDto, currentUser?: JwtPayload) {
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);
    if (managerCenterId && dto.centerId !== managerCenterId) {
      throw new ForbiddenException('You can only create groups in your assigned center');
    }

    const center = await this.prisma.center.findUnique({ where: { id: dto.centerId } });
    if (!center) {
      throw new BadRequestException(`Center with ID ${dto.centerId} not found`);
    }

    this.teacherValidation.validateGroupTeachers({
      teacherId: dto.teacherId,
      secondTeacherId: dto.secondTeacherId,
      requireBoth: true,
    });

    const teacherIdsToValidate = [dto.teacherId, dto.secondTeacherId].filter(Boolean) as string[];
    const uniqueTeacherIds = [...new Set(teacherIdsToValidate)];
    await this.teacherValidation.assertTeachersExist(uniqueTeacherIds);
    await this.teacherValidation.assertTeachersBelongToCenter(dto.centerId, uniqueTeacherIds);

    if (dto.calendarPlan && !dto.schedule?.length) {
      throw new BadRequestException('Add at least one weekly time slot to generate calendar lessons.');
    }

    const weeklySlots = (dto.schedule ?? []) as GroupWeeklySlot[];
    const nextCalendar: GroupCalendarStored | null = dto.calendarPlan
      ? {
          dateFrom: dto.calendarPlan.dateFrom,
          dateTo: dto.calendarPlan.dateTo,
          topic: dto.calendarPlan.topic,
          description: dto.calendarPlan.description,
          rolling: true,
          suppressedSlotStarts: [],
        }
      : null;

    const scheduleForCreate =
      buildScheduleJson(weeklySlots, nextCalendar) ??
      (weeklySlots.length > 0 ? (weeklySlots as unknown as Prisma.InputJsonValue) : undefined);

    let group = await this.prisma.group.create({
      data: {
        name: dto.name,
        level: dto.level,
        description: dto.description,
        iconKey: dto.iconKey ?? null,
        maxStudents: FIXED_GROUP_MAX_STUDENTS,
        centerId: dto.centerId,
        teacherId: dto.teacherId,
        secondTeacherId: dto.secondTeacherId,
        secondTeacherStartsFirstWeek: dto.secondTeacherStartsFirstWeek ?? false,
        schedule: scheduleForCreate ?? undefined,
        isActive: dto.isActive ?? true,
      },
      include: groupWriteInclude,
    });

    await this.chatSync.createGroupChat(group.id, group.name, [
      dto.teacherId as string,
      dto.secondTeacherId as string,
    ]);

    const syncedSchedule = await this.groupScheduleLessonsService.syncAfterGroupSaved({
      groupId: group.id,
      teacherId: group.teacherId,
      secondTeacherId: group.secondTeacherId,
      secondTeacherStartsFirstWeek: group.secondTeacherStartsFirstWeek,
      weeklySlots,
      calendar: nextCalendar,
      previousScheduleJson: null,
      previousTeacherId: null,
      previousSecondTeacherId: null,
      previousSecondTeacherStartsFirstWeek: null,
    });

    if (syncedSchedule !== undefined) {
      group = await this.prisma.group.update({
        where: { id: group.id },
        data: { schedule: syncedSchedule },
        include: groupWriteInclude,
      });
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto, currentUser?: JwtPayload) {
    await this.accessService.assertManagerGroupAccess(id, currentUser);
    const currentGroup = await this.queryService.findById(id, currentUser);
    const managerCenterId = getManagerCenterIdOrThrow(currentUser);

    if (dto.centerId !== undefined) {
      if (!dto.centerId || dto.centerId.trim() === '') {
        throw new BadRequestException('Center ID cannot be empty. A group must belong to a center.');
      }

      const center = await this.prisma.center.findUnique({ where: { id: dto.centerId } });
      if (!center) {
        throw new BadRequestException(`Center with ID ${dto.centerId} not found`);
      }
      if (managerCenterId && dto.centerId !== managerCenterId) {
        throw new ForbiddenException('You can only move group inside your assigned center');
      }
    }

    const nextTeacherId =
      dto.teacherId !== undefined ? dto.teacherId || null : currentGroup.teacherId;
    const nextSecondTeacherId =
      dto.secondTeacherId !== undefined ? dto.secondTeacherId || null : currentGroup.secondTeacherId;
    const nextSecondTeacherStartsFirstWeek =
      dto.secondTeacherStartsFirstWeek !== undefined
        ? dto.secondTeacherStartsFirstWeek
        : currentGroup.secondTeacherStartsFirstWeek;

    this.teacherValidation.validateGroupTeachers({
      teacherId: nextTeacherId,
      secondTeacherId: nextSecondTeacherId,
      requireBoth: true,
    });

    const nextCenterId = dto.centerId !== undefined ? dto.centerId : currentGroup.centerId;
    const teacherIdsToValidate = [nextTeacherId, nextSecondTeacherId].filter(Boolean) as string[];
    const uniqueTeacherIds = [...new Set(teacherIdsToValidate)];
    await this.teacherValidation.assertTeachersExist(uniqueTeacherIds);
    await this.teacherValidation.assertTeachersBelongToCenter(nextCenterId, uniqueTeacherIds);

    const oldTeacherIds = [currentGroup.teacherId, currentGroup.secondTeacherId];
    const newTeacherIds = [nextTeacherId, nextSecondTeacherId];
    const teachersChangedForChat =
      oldTeacherIds.some((tid, i) => tid !== newTeacherIds[i]) ||
      dto.teacherId !== undefined ||
      dto.secondTeacherId !== undefined;

    if (teachersChangedForChat) {
      const removedIds = oldTeacherIds.filter(
        (oldId) => oldId && !newTeacherIds.includes(oldId),
      );
      await this.chatSync.removeTeachersFromGroupChat(id, removedIds);
      await this.chatSync.syncGroupTeachersInChat(id, currentGroup.name, newTeacherIds);
    }

    const {
      schedule: scheduleDto,
      calendarPlan,
      confirmReplaceGeneratedLessons: _confirmReplaceGeneratedLessons,
      teacherId: _dtoTeacherId,
      secondTeacherId,
      secondTeacherStartsFirstWeek: _dtoSecondTeacherStartsFirstWeek,
      ...rest
    } = dto;

    const prevParsed = parseGroupSchedulePayload(currentGroup.schedule);
    const nextWeekly: GroupWeeklySlot[] =
      scheduleDto !== undefined ? ((scheduleDto ?? []) as GroupWeeklySlot[]) : prevParsed.weeklySlots;

    let nextCalendar: GroupCalendarStored | null;
    if (calendarPlan === undefined) {
      nextCalendar = prevParsed.calendar;
    } else if (calendarPlan === null) {
      nextCalendar = null;
    } else {
      nextCalendar = {
        dateFrom: calendarPlan.dateFrom,
        dateTo: calendarPlan.dateTo,
        topic: calendarPlan.topic,
        description: calendarPlan.description,
        rolling: prevParsed.calendar?.rolling !== false,
        suppressedSlotStarts: prevParsed.calendar?.suppressedSlotStarts ?? [],
      };
    }

    if (nextCalendar && nextWeekly.length === 0) {
      throw new BadRequestException('Add at least one weekly time slot for calendar generation.');
    }

    let finalSchedule: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
      buildScheduleJson(nextWeekly, nextCalendar) ??
      (nextWeekly.length > 0
        ? (nextWeekly as unknown as Prisma.InputJsonValue)
        : scheduleDto === null
          ? Prisma.JsonNull
          : undefined);

    const synced = await this.groupScheduleLessonsService.syncAfterGroupSaved({
      groupId: id,
      teacherId: nextTeacherId,
      secondTeacherId: nextSecondTeacherId,
      secondTeacherStartsFirstWeek: nextSecondTeacherStartsFirstWeek,
      weeklySlots: nextWeekly,
      calendar: nextCalendar,
      previousScheduleJson: currentGroup.schedule,
      previousTeacherId: currentGroup.teacherId,
      previousSecondTeacherId: currentGroup.secondTeacherId,
      previousSecondTeacherStartsFirstWeek: currentGroup.secondTeacherStartsFirstWeek,
    });
    if (synced !== undefined) {
      finalSchedule = synced;
    }

    if (finalSchedule === undefined && nextWeekly.length === 0 && !nextCalendar) {
      finalSchedule = Prisma.JsonNull;
    }

    const scheduleUpdate = finalSchedule !== undefined ? { schedule: finalSchedule } : {};

    return this.prisma.group.update({
      where: { id },
      data: {
        ...rest,
        ...(secondTeacherId !== undefined ? { secondTeacherId: secondTeacherId || null } : {}),
        ...(dto.secondTeacherStartsFirstWeek !== undefined
          ? { secondTeacherStartsFirstWeek: dto.secondTeacherStartsFirstWeek }
          : {}),
        teacherId: nextTeacherId,
        ...scheduleUpdate,
        maxStudents: FIXED_GROUP_MAX_STUDENTS,
      },
      include: groupWriteInclude,
    });
  }

  async delete(id: string, currentUser?: JwtPayload) {
    await this.queryService.findById(id, currentUser);
    return this.prisma.group.delete({ where: { id } });
  }

  async toggleActive(id: string, currentUser?: JwtPayload) {
    const group = await this.queryService.findById(id, currentUser);
    return this.prisma.group.update({
      where: { id },
      data: { isActive: !group.isActive },
    });
  }
}
