import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  QueryLessonDto,
  GetUpcomingLessonsQueryDto,
  CompleteLessonDto,
  CreateRecurringLessonDto,
} from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, LessonStatus } from '@ilona/database';
import { JwtPayload } from '../../common/types/auth.types';
import { getManagerCenterIdOrThrow } from '../../common/utils/manager-scope.util';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER, UserRole.STUDENT)
  async findAll(@Query() query: QueryLessonDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    // Handle both single groupId (backward compatibility) and groupIds array
    const groupIds = query.groupIds || (query.groupId ? [query.groupId] : undefined);
    return this.lessonsService.findAll({
      skip: query.skip,
      take: query.take,
      centerId: query.centerId,
      groupId: query.groupId,
      groupIds,
      teacherId: query.teacherId,
      status: query.status as LessonStatus,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.q,
      currentUserId: user?.sub,
      userRole: user?.role,
    });
  }

  @Get('my-lessons')
  @Roles(UserRole.TEACHER)
  async getMyLessons(@CurrentUser() user: JwtPayload, @Query() query: QueryLessonDto): Promise<unknown> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return { items: [], total: 0, page: 1, pageSize: query.take || 50, totalPages: 0 };
    }

    return this.lessonsService.findByTeacher(
      teacher.id,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
    );
  }

  @Get('today')
  @Roles(UserRole.TEACHER)
  async getTodayLessons(@CurrentUser() user: JwtPayload): Promise<unknown> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return [];
    }

    return this.lessonsService.getTodayLessons(teacher.id);
  }

  @Get('upcoming')
  @Roles(UserRole.TEACHER)
  async getUpcomingLessons(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetUpcomingLessonsQueryDto,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return [];
    }

    return this.lessonsService.getUpcoming(teacher.id, query.limit ?? 10);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async getStatistics(@CurrentUser() user: JwtPayload, @Query() query: QueryLessonDto) {
    let teacherId: string | undefined;
    let managerCenterId: string | undefined;

    if (user.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: user.sub },
      });
      teacherId = teacher?.id;
    } else if (query.teacherId) {
      teacherId = query.teacherId;
    }

    if (user.role === UserRole.MANAGER) {
      managerCenterId = getManagerCenterIdOrThrow(user);
    }

    return this.lessonsService.getLessonStatistics(
      teacherId,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
      managerCenterId,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER, UserRole.STUDENT)
  async findById(@Param('id') id: string, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    return this.lessonsService.findById(id, user?.sub, user?.role);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async create(@Body() dto: CreateLessonDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    // For teachers, validate that they can only create lessons for their own groups
    if (user?.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: user.sub },
        include: { groups: { select: { id: true } } },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      // Ensure teacherId matches the current teacher
      if (dto.teacherId !== teacher.id) {
        throw new ForbiddenException('You can only create lessons for yourself');
      }

      // Ensure group belongs to the teacher
      const teacherGroupIds = teacher.groups.map((g: { id: string }) => g.id);
      if (!teacherGroupIds.includes(dto.groupId)) {
        throw new ForbiddenException('You can only create lessons for your assigned groups');
      }
    }

    return this.lessonsService.create(dto, user?.sub, user?.role);
  }

  @Post('recurring')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async createRecurring(@Body() dto: CreateRecurringLessonDto, @CurrentUser() user?: JwtPayload): Promise<unknown> {
    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    let teacherId = dto.teacherId;

    // For teachers, validate that they can only create lessons for themselves
    if (user?.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: user.sub },
        include: { groups: { select: { id: true } } },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      // Auto-set teacherId to current teacher
      teacherId = teacher.id;

      // Ensure group belongs to the teacher
      const teacherGroupIds = teacher.groups.map((g: { id: string }) => g.id);
      if (!teacherGroupIds.includes(dto.groupId)) {
        throw new ForbiddenException('You can only create lessons for your assigned groups');
      }
    }

    if (user?.role === UserRole.MANAGER) {
      const managerCenterId = getManagerCenterIdOrThrow(user);
      if (managerCenterId) {
        const group = await this.prisma.group.findUnique({
          where: { id: dto.groupId },
          select: { centerId: true },
        });
        if (!group || group.centerId !== managerCenterId) {
          throw new ForbiddenException('You can only create recurring lessons in your center');
        }
      }
    }

    return this.lessonsService.createRecurring({
      groupId: dto.groupId,
      teacherId,
      weekdays: dto.weekdays,
      startTime: dto.startTime,
      endTime: dto.endTime,
      startDate,
      endDate,
      topic: dto.topic,
      description: dto.description,
    });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.lessonsService.update(id, dto, user?.sub, user?.role);
  }

  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async startLesson(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lessonsService.startLesson(id, user.sub, user.role);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async completeLesson(
    @Param('id') id: string,
    @Body() dto: CompleteLessonDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.lessonsService.completeLesson(id, dto, user.sub, user.role);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async cancelLesson(@Param('id') id: string, @Body('reason') reason?: string, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.cancelLesson(id, reason, user?.sub, user?.role);
  }

  @Patch(':id/vocabulary-sent')
  @Roles(UserRole.TEACHER)
  async markVocabularySent(@Param('id') id: string) {
    return this.lessonsService.markVocabularySent(id);
  }

  @Patch(':id/absence-complete')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async markAbsenceComplete(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.markAbsenceComplete(id, user?.sub, user?.role);
  }

  @Patch(':id/voice-sent')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async markVoiceSent(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.markVoiceSent(id, user?.sub, user?.role);
  }

  @Patch(':id/text-sent')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async markTextSent(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.markTextSent(id, user?.sub, user?.role);
  }

  @Delete('bulk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER)
  async deleteBulk(@Body() body: { lessonIds: string[] }, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.deleteBulk(body.lessonIds, user?.sub, user?.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async delete(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    if (user?.role === UserRole.MANAGER) {
      await this.lessonsService.findById(id, user.sub, user.role);
    }
    return this.lessonsService.delete(id);
  }
}
