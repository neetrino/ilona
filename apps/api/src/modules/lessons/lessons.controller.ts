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
import {
  CreateLessonDto,
  UpdateLessonDto,
  QueryLessonDto,
  CompleteLessonDto,
  CreateRecurringLessonDto,
} from './dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole, LessonStatus } from '@prisma/client';
import { JwtPayload } from '../../common/types/auth.types';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  async findAll(@Query() query: QueryLessonDto, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.findAll({
      skip: query.skip,
      take: query.take,
      groupId: query.groupId,
      teacherId: query.teacherId,
      status: query.status as LessonStatus,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      currentUserId: user?.sub,
      userRole: user?.role,
    });
  }

  @Get('my-lessons')
  @Roles(UserRole.TEACHER)
  async getMyLessons(@CurrentUser() user: JwtPayload, @Query() query: QueryLessonDto) {
    const teacher = await this.lessonsService['prisma'].teacher.findUnique({
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
  async getTodayLessons(@CurrentUser() user: JwtPayload) {
    const teacher = await this.lessonsService['prisma'].teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return [];
    }

    return this.lessonsService.getTodayLessons(teacher.id);
  }

  @Get('upcoming')
  @Roles(UserRole.TEACHER)
  async getUpcomingLessons(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number) {
    const teacher = await this.lessonsService['prisma'].teacher.findUnique({
      where: { userId: user.sub },
    });

    if (!teacher) {
      return [];
    }

    return this.lessonsService.getUpcoming(teacher.id, limit || 10);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getStatistics(@CurrentUser() user: JwtPayload, @Query() query: QueryLessonDto) {
    let teacherId: string | undefined;

    if (user.role === UserRole.TEACHER) {
      const teacher = await this.lessonsService['prisma'].teacher.findUnique({
        where: { userId: user.sub },
      });
      teacherId = teacher?.id;
    } else if (query.teacherId) {
      teacherId = query.teacherId;
    }

    return this.lessonsService.getLessonStatistics(
      teacherId,
      query.dateFrom ? new Date(query.dateFrom) : undefined,
      query.dateTo ? new Date(query.dateTo) : undefined,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    return this.lessonsService.findById(id, user?.sub, user?.role);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async create(@Body() dto: CreateLessonDto, @CurrentUser() user?: JwtPayload) {
    // For teachers, validate that they can only create lessons for their own groups
    if (user?.role === UserRole.TEACHER) {
      const teacher = await this.lessonsService['prisma'].teacher.findUnique({
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
      const teacherGroupIds = teacher.groups.map((g) => g.id);
      if (!teacherGroupIds.includes(dto.groupId)) {
        throw new ForbiddenException('You can only create lessons for your assigned groups');
      }
    }

    return this.lessonsService.create(dto);
  }

  @Post('recurring')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async createRecurring(@Body() dto: CreateRecurringLessonDto, @CurrentUser() user?: JwtPayload) {
    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    let teacherId = dto.teacherId;

    // For teachers, validate that they can only create lessons for themselves
    if (user?.role === UserRole.TEACHER) {
      const teacher = await this.lessonsService['prisma'].teacher.findUnique({
        where: { userId: user.sub },
        include: { groups: { select: { id: true } } },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }

      // Auto-set teacherId to current teacher
      teacherId = teacher.id;

      // Ensure group belongs to the teacher
      const teacherGroupIds = teacher.groups.map((g) => g.id);
      if (!teacherGroupIds.includes(dto.groupId)) {
        throw new ForbiddenException('You can only create lessons for your assigned groups');
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
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.lessonsService.update(id, dto, user?.sub, user?.role);
  }

  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async startLesson(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.lessonsService.startLesson(id, user.sub, user.role);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async completeLesson(
    @Param('id') id: string,
    @Body() dto: CompleteLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lessonsService.completeLesson(id, dto, user.sub, user.role);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  async cancelLesson(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.lessonsService.cancelLesson(id, reason);
  }

  @Patch(':id/vocabulary-sent')
  @Roles(UserRole.TEACHER)
  async markVocabularySent(@Param('id') id: string) {
    return this.lessonsService.markVocabularySent(id);
  }

  @Patch(':id/absence-complete')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markAbsenceComplete(@Param('id') id: string) {
    return this.lessonsService.markAbsenceComplete(id);
  }

  @Patch(':id/voice-sent')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markVoiceSent(@Param('id') id: string) {
    return this.lessonsService.markVoiceSent(id);
  }

  @Patch(':id/text-sent')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async markTextSent(@Param('id') id: string) {
    return this.lessonsService.markTextSent(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }
}
